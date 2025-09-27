import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttendeeStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  CHECKED_IN = 'checked-in',
}

@Entity('attendees')
export class Attendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  email: string;

  @Column()
  mobileNo: string;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: AttendeeStatus,
    default: AttendeeStatus.CONFIRMED,
  })
  attendeeStatus: AttendeeStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
