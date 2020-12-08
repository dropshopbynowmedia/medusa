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

import { Cart } from "./cart"
import { Order } from "./order"

@Entity()
export class Payment {
  @PrimaryColumn()
  id: string

  @OneToOne(() => Cart)
  @JoinColumn({ name: "cart_id" })
  cart: Cart

  @ManyToOne(
    () => Order,
    order => order.payments
  )
  @JoinColumn({ name: "order_id" })
  order: Order

  @Column({ type: "int" })
  amount: number

  @Column()
  currency_code: string

  @Column({ type: "int" })
  amount_refunded: number

  @Column()
  provider_id: string

  @Column({ type: "jsonb" })
  data: any

  @Column({ nullable: true })
  captured_at: Date

  @Column({ nullable: true })
  canceled_at: Date

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date

  @Column({ type: "jsonb", nullable: true })
  metadata: any

  @BeforeInsert()
  private beforeInsert() {
    const id = randomize("Aa0", 16)
    this.id = `pay_${id}`
  }
}
