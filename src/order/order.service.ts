import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, PaymentStatus } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { OrderItemAddon } from 'src/entities/order-item-addon.entity';
import { OrderItemTax } from 'src/entities/order-item-tax.entity';
import { PromoCode, DiscountType } from 'src/entities/promoCode.entity';
import { CreateOrderDto } from './dto/orderDto';
import { TicketService } from 'src/ticket/tickets.service';
import { Ticket } from 'src/entities/ticket.entity';
import { Event } from 'src/entities/event.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,

    private readonly dataSource: DataSource,
    private readonly ticketService: TicketService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // 1️⃣ Create base order
      const order = manager.getRepository(Order).create({
        event: { id: dto.eventId } as Event,
        purchaserName: dto.purchaserName,
        purchaseEmail: dto.purchaseEmail,
        purchaseMobile: dto.purchaseMobile,
        purchaseBillingAddress: dto.purchaseBillingAddress,
        promoCode: dto.promoCode,
        affiliateCode: dto.affiliateCode,
        totalAmount: 0,
        paymentStatus: PaymentStatus.PENDING,
      });
      const savedOrder = await manager.getRepository(Order).save(order);

      let orderTotal = 0;

      // 2️⃣ Fetch all tickets
      const ticketIds = dto.items.map((i) => i.ticketRefId);
      const tickets = await manager.getRepository(Ticket).findByIds(ticketIds);
      const ticketMap = Object.fromEntries(tickets.map((t) => [t.id, t]));

      // 3️⃣ Reserve all tickets in Redis in parallel
      await Promise.all(
        dto.items.map((item) =>
          this.ticketService.reserveTickets(
            item.ticketRefId,
            item.quantity,
            savedOrder.id,
          ),
        ),
      );

      // 4️⃣ Prepare order items
      const orderItems: OrderItem[] = dto.items.map((item) => {
        const ticket = ticketMap[item.ticketRefId];
        if (!ticket) throw new BadRequestException('Ticket not found');

        let effectivePrice = ticket.price;
        const now = new Date();
        if (
          ticket.early_bird_enabled &&
          ticket.early_bird_start &&
          ticket.early_bird_end &&
          now >= ticket.early_bird_start &&
          now <= ticket.early_bird_end
        ) {
          effectivePrice = Number(ticket.early_bird_discount_value) || 0;
        }

        const totalAmount = Number(item.quantity) * effectivePrice;

        const addonsTotal =
          item.addons?.reduce(
            (sum, addon) => sum + Number(addon.price) * Number(addon.quantity),
            0,
          ) || 0;
        const taxesTotal =
          item.taxes?.reduce((sum, tax) => sum + Number(tax.taxAmount), 0) || 0;

        orderTotal += totalAmount + addonsTotal + taxesTotal;

        return manager.getRepository(OrderItem).create({
          order: savedOrder,
          ticketRefId: item.ticketRefId,
          ticketClass: item.ticketClass,
          quantity: Number(item.quantity),
          price: Number(effectivePrice),
          totalAmount,
        });
      });

      const savedOrderItems = await manager
        .getRepository(OrderItem)
        .save(orderItems);

      // 5️⃣ Bulk insert addons & taxes
      const addons: OrderItemAddon[] = [];
      const taxes: OrderItemTax[] = [];
      dto.items.forEach((item, i) => {
        item.addons?.forEach((addon) => {
          addons.push(
            manager.getRepository(OrderItemAddon).create({
              orderItem: savedOrderItems[i],
              addonRefId: addon.addonRefId,
              addonName: addon.addonName,
              price: Number(addon.price),
              quantity: Number(addon.quantity),
              totalAmount: Number(addon.price) * Number(addon.quantity),
            }),
          );
        });
        item.taxes?.forEach((tax) => {
          taxes.push(
            manager.getRepository(OrderItemTax).create({
              orderItem: savedOrderItems[i],
              taxRefId: tax.taxRefId,
              taxName: tax.taxName,
              taxRate: Number(tax.taxRate),
              taxAmount: Number(tax.taxAmount),
            }),
          );
        });
      });
      await manager.getRepository(OrderItemAddon).save(addons);
      await manager.getRepository(OrderItemTax).save(taxes);

      // 6️⃣ Apply promo code
      if (dto.promoCode) {
        const promo = await manager
          .getRepository(PromoCode)
          .findOne({ where: { code: dto.promoCode, isActive: true } });
        if (!promo) throw new BadRequestException('Invalid promo code');
        const now = new Date();
        if (
          (promo.validTo && now > promo.validTo) ||
          (promo.usageLimit && promo.usedCount >= promo.usageLimit)
        ) {
          throw new BadRequestException('Promo not available anymore');
        }

        const discountedAmount =
          promo.discountType === DiscountType.PERCENTAGE
            ? (orderTotal * promo.discountValue) / 100
            : promo.discountValue;

        orderTotal -= Number(discountedAmount);
        savedOrder.discountedAmount = Number(discountedAmount);
      }

      savedOrder.totalAmount = Number(orderTotal);
      await manager.getRepository(Order).save(savedOrder);

      return manager.getRepository(Order).findOneOrFail({
        where: { id: savedOrder.id },
        relations: ['Items', 'Items.addons', 'Items.taxes', 'event'],
      });
    });
  }

  async getPendingOrderByEmail(email: string) {
    return this.orderRepo.findOne({
      where: {
        purchaseEmail: email,
        paymentStatus: PaymentStatus.PENDING,
      },
      relations: ['Items', 'Items.addons', 'Items.taxes', 'event'],
    });
  }

  async createOrGetPendingOrder(dto: CreateOrderDto): Promise<Order> {
    const existing = await this.getPendingOrderByEmail(dto.purchaseEmail);

    if (existing) {
      return existing;
    }

    return this.createOrder(dto);
  }

  async getOrder(
    orderId: string,
    includeEvent: boolean = false,
  ): Promise<Order> {
    const relations = ['Items', 'Items.addons', 'Items.taxes'];
    if (includeEvent) relations.push('event');

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations,
    });

    if (!order) throw new ForbiddenException('Order not found');

    return order;
  }
}
