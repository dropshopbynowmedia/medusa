import {
  Entity,
  BeforeInsert,
  Index,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  AfterLoad,
  Timestamp,
  BeforeUpdate,
} from "typeorm"
import { ulid } from "ulid"

import { Region } from "./region"
import { Address } from "./address"
import { LineItem } from "./line-item"
import { Discount } from "./discount"
import { Customer } from "./customer"
import { PaymentSession } from "./payment-session"
import { Payment } from "./payment"
import { GiftCard } from "./gift-card"
import { ShippingMethod } from "./shipping-method"

export enum CartType {
  DEFAULT = "default",
  SWAP = "swap",
  PAYMENT_LINK = "payment_link",
}

@Entity()
export class Cart {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  email: string

  @Index()
  @Column({ nullable: true })
  billing_address_id: string

  @ManyToOne(() => Address, {
    cascade: ["insert", "remove", "soft-remove"],
  })
  @JoinColumn({ name: "billing_address_id" })
  billing_address: Address

  @Index()
  @Column({ nullable: true })
  shipping_address_id: string

  @ManyToOne(() => Address, {
    cascade: ["insert", "remove", "soft-remove"],
  })
  @JoinColumn({ name: "shipping_address_id" })
  shipping_address: Address

  @OneToMany(
    () => LineItem,
    lineItem => lineItem.cart,
    { cascade: ["insert", "remove"] }
  )
  items: LineItem[]

  @Index()
  @Column()
  region_id: string

  @ManyToOne(() => Region)
  @JoinColumn({ name: "region_id" })
  region: Region

  @ManyToMany(() => Discount)
  @JoinTable({
    name: "cart_discounts",
    joinColumn: {
      name: "cart_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "discount_id",
      referencedColumnName: "id",
    },
  })
  discounts: Discount

  @ManyToMany(() => GiftCard)
  @JoinTable({
    name: "cart_gift_cards",
    joinColumn: {
      name: "cart_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "gift_card_id",
      referencedColumnName: "id",
    },
  })
  gift_cards: GiftCard

  @Index()
  @Column({ nullable: true })
  customer_id: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customer_id" })
  customer: Customer

  payment_session: PaymentSession

  @OneToMany(
    () => PaymentSession,
    paymentSession => paymentSession.cart,
    { cascade: true }
  )
  payment_sessions: PaymentSession[]

  @Index()
  @Column({ nullable: true })
  payment_id: string

  @OneToOne(() => Payment)
  @JoinColumn({ name: "payment_id" })
  payment: Payment

  @OneToMany(
    () => ShippingMethod,
    method => method.cart,
    { cascade: ["soft-remove", "remove"] }
  )
  shipping_methods: ShippingMethod[]

  @Column({ type: "enum", enum: CartType, default: "default" })
  type: boolean

  @Column({ type: "timestamptz", nullable: true })
  completed_at: Date

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date

  @DeleteDateColumn({ type: "timestamptz" })
  deleted_at: Date

  @Column({ type: "jsonb", nullable: true })
  metadata: any

  @Column({ nullable: true })
  idempotency_key: string

  // Total fields
  shipping_total: number
  discount_total: number
  tax_total: number
  refunded_total: number
  total: number
  subtotal: number
  refundable_amount: number
  gift_card_total: number

  @BeforeInsert()
  private beforeInsert() {
    if (this.id) return
    const id = ulid()
    this.id = `cart_${id}`
  }

  @AfterLoad()
  private afterLoad() {
    if (this.payment_sessions) {
      this.payment_session = this.payment_sessions.find(p => p.is_selected)
    }
  }
}
