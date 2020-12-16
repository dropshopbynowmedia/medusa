import {
  Entity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import randomize from "randomatic"

import { Currency } from "./currency"
import { Cart } from "./cart"
import { Order } from "./order"

export enum RefundReason {
  DISCOUNT = "discount",
  RETURN = "return",
  OTHER = "other",
}

@Entity()
export class Refund {
  @PrimaryColumn()
  id: string

  @Column()
  order_id: string

  @ManyToOne(
    () => Order,
    order => order.payments
  )
  @JoinColumn({ name: "order_id" })
  order: Order

  @Column()
  currency_code: string

  @ManyToOne(() => Currency)
  @JoinColumn({ name: "currency_code", referencedColumnName: "code" })
  currency: Currency

  @Column({ type: "int" })
  amount: number

  @Column({ nullable: true })
  note: string

  @Column({ type: "enum", enum: RefundReason })
  reason: string

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date

  @Column({ type: "jsonb", nullable: true })
  metadata: any

  @BeforeInsert()
  private beforeInsert() {
    const id = randomize("Aa0", 16)
    this.id = `ref_${id}`
  }
}