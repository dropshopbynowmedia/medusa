import {
  Entity,
  BeforeInsert,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryColumn,
  Index,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm"
import { ulid } from "ulid"

import { Fulfillment } from "./fulfillment"
import { LineItem } from "./line-item"
import { ClaimItem } from "./claim-item"
import { Order } from "./order"
import { Return } from "./return"
import { ShippingMethod } from "./shipping-method"
import { Address } from "./address"

export enum ClaimType {
  REFUND = "refund",
  REPLACE = "replace",
}

export enum ClaimPaymentStatus {
  NA = "na",
  NOT_REFUNDED = "not_refunded",
  REFUNDED = "refunded",
}

export enum ClaimFulfillmentStatus {
  NOT_FULFILLED = "not_fulfilled",
  PARTIALLY_FULFILLED = "partially_fulfilled",
  FULFILLED = "fulfilled",
  PARTIALLY_SHIPPED = "partially_shipped",
  SHIPPED = "shipped",
  PARTIALLY_RETURNED = "partially_returned",
  RETURNED = "returned",
  CANCELED = "canceled",
  REQUIRES_ACTION = "requires_action",
}

@Entity()
export class ClaimOrder {
  @PrimaryColumn()
  id: string

  @Column({
    type: "enum",
    enum: ClaimPaymentStatus,
    default: ClaimPaymentStatus.NA,
  })
  payment_status: ClaimPaymentStatus

  @Column({
    type: "enum",
    enum: ClaimFulfillmentStatus,
    default: ClaimFulfillmentStatus.NOT_FULFILLED,
  })
  fulfillment_status: ClaimFulfillmentStatus

  @OneToMany(
    () => ClaimItem,
    ci => ci.claim_order
  )
  claim_items: ClaimItem[]

  @OneToMany(
    () => LineItem,
    li => li.claim_order,
    { cascade: ["insert"] }
  )
  additional_items: LineItem[]

  @Column({ type: "enum", enum: ClaimType })
  type: ClaimType

  @Index()
  @Column()
  order_id: string

  @ManyToOne(
    () => Order,
    o => o.claims
  )
  @JoinColumn({ name: "order_id" })
  order: Order

  @OneToOne(
    () => Return,
    ret => ret.claim_order
  )
  return_order: Return

  @Index()
  @Column({ nullable: true })
  shipping_address_id: string

  @ManyToOne(() => Address, { cascade: ["insert"] })
  @JoinColumn({ name: "shipping_address_id" })
  shipping_address: Address

  @OneToMany(
    () => ShippingMethod,
    method => method.claim_order,
    { cascade: ["insert"] }
  )
  shipping_methods: ShippingMethod[]

  @OneToMany(
    () => Fulfillment,
    fulfillment => fulfillment.claim_order,
    { cascade: ["insert"] }
  )
  fulfillments: Fulfillment[]

  @Column({ type: "int", nullable: true })
  refund_amount: number

  @Column({ type: "timestamptz", nullable: true })
  canceled_at: Date

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

  @BeforeInsert()
  private beforeInsert() {
    if (this.id) return
    const id = ulid()
    this.id = `claim_${id}`
  }
}
