import { MigrationInterface, QueryRunner } from "typeorm"

export class initialSchema1607440039327 implements MigrationInterface {
  name = "initialSchema1607440039327"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fulfillment_provider" ("id" character varying NOT NULL, "is_installed" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_beb35a6de60a6c4f91d5ae57e44" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "fulfillment_item" ("fulfillment_id" character varying NOT NULL, "item_id" character varying NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "PK_bc3e8a388de75db146a249922e0" PRIMARY KEY ("fulfillment_id", "item_id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "fulfillment" ("id" character varying NOT NULL, "swap_id" character varying, "order_id" character varying, "tracking_numbers" jsonb NOT NULL DEFAULT '[]', "data" jsonb NOT NULL, "shipped_at" TIMESTAMP, "canceled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "provider_id" character varying, CONSTRAINT "REL_a52e234f729db789cf473297a5" UNIQUE ("swap_id"), CONSTRAINT "PK_50c102da132afffae660585981f" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "return_item" ("return_id" character varying NOT NULL, "item_id" character varying NOT NULL, "quantity" integer NOT NULL, "requested_quantity" integer, "received_quantity" integer, CONSTRAINT "PK_46409dc1dd5f38509b9000c3069" PRIMARY KEY ("return_id", "item_id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "payment_provider" ("id" character varying NOT NULL, "is_installed" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ea94f42b6c88e9191c3649d7522" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "region" ("id" character varying NOT NULL, "currency_code" character varying NOT NULL, "tax_rate" integer NOT NULL, "tax_code" character varying, "countries" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_5f48ffc3af96bc486f5f3f3a6da" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "image" ("id" character varying NOT NULL, "url" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "product_option_value" ("id" character varying NOT NULL, "value" character varying NOT NULL, "option_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "variant_id" character varying, CONSTRAINT "PK_2ab71ed3b21be5800905c621535" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_cdf4388f294b30a25c627d69fe" ON "product_option_value" ("option_id") `
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b222db89e432f07f33ceff8441" ON "product_option_value" ("option_id", "value") `
    )
    await queryRunner.query(
      `CREATE TABLE "product_option" ("id" character varying NOT NULL, "title" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "product_id" character varying, CONSTRAINT "PK_4cf3c467e9bc764bdd32c4cd938" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "money_amount" ("id" character varying NOT NULL, "currency" character varying NOT NULL, "amount" integer NOT NULL, "variant_id" character varying, CONSTRAINT "PK_022e49a7e21a8dfb820f788778a" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "product_variant" ("id" character varying NOT NULL, "title" character varying NOT NULL, "sku" character varying, "barcode" character varying, "inventory_quantity" integer NOT NULL, "allow_backorder" boolean NOT NULL DEFAULT false, "manage_inventory" boolean NOT NULL DEFAULT true, "hs_code" character varying, "origin_country" character varying, "mid_code" character varying, "material" character varying, "weight" integer, "length" integer, "height" integer, "width" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "product_id" character varying, CONSTRAINT "PK_1ab69c9935c61f7c70791ae0a9f" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f4dc2c0888b66d547c175f090e" ON "product_variant" ("sku") `
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9db95c4b71f632fc93ecbc3d8b" ON "product_variant" ("barcode") `
    )
    await queryRunner.query(
      `CREATE TYPE "shipping_option_requirement_type_enum" AS ENUM('min_subtotal', 'max_subtotal')`
    )
    await queryRunner.query(
      `CREATE TABLE "shipping_option_requirement" ("id" character varying NOT NULL, "type" "shipping_option_requirement_type_enum" NOT NULL, "amount" integer NOT NULL, "shipping_option_id" character varying, CONSTRAINT "PK_a0ff15442606d9f783602cb23a7" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "shipping_option_price_type_enum" AS ENUM('flat_rate', 'calculated')`
    )
    await queryRunner.query(
      `CREATE TABLE "shipping_option" ("id" character varying NOT NULL, "price_type" "shipping_option_price_type_enum" NOT NULL, "amount" integer NOT NULL, "is_return" boolean NOT NULL DEFAULT false, "data" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "region_id" character varying, "profile_id" character varying, "provider_id" character varying, CONSTRAINT "PK_2e56fddaa65f3a26d402e5d786e" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "shipping_profile_type_enum" AS ENUM('default', 'gift_card', 'custom')`
    )
    await queryRunner.query(
      `CREATE TABLE "shipping_profile" ("id" character varying NOT NULL, "name" character varying NOT NULL, "type" "shipping_profile_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_c8120e4543a5a3a121f2968a1ec" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "product" ("id" character varying NOT NULL, "title" character varying NOT NULL, "subtitle" character varying, "description" character varying NOT NULL, "tags" character varying NOT NULL, "handle" character varying NOT NULL, "is_giftcard" boolean NOT NULL DEFAULT false, "thumbnail" character varying NOT NULL, "weight" integer, "length" integer, "height" integer, "width" integer, "hs_code" character varying, "origin_country" character varying, "mid_code" character varying, "material" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "profile_id" character varying, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_db7355f7bd36c547c8a4f539e5" ON "product" ("handle") `
    )
    await queryRunner.query(
      `CREATE TYPE "discount_rule_type_enum" AS ENUM('fixed', 'percentage', 'free_shipping')`
    )
    await queryRunner.query(
      `CREATE TYPE "discount_rule_allocation_enum" AS ENUM('total', 'item')`
    )
    await queryRunner.query(
      `CREATE TABLE "discount_rule" ("id" character varying NOT NULL, "description" character varying NOT NULL, "type" "discount_rule_type_enum" NOT NULL, "value" integer NOT NULL, "allocation" "discount_rule_allocation_enum", "usage_limit" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_ac2c280de3701b2d66f6817f760" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "discount" ("id" character varying NOT NULL, "code" character varying NOT NULL, "is_dynamic" boolean NOT NULL, "is_disabled" boolean NOT NULL, "starts_at" TIMESTAMP NOT NULL DEFAULT 'now()', "ends_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "discount_rule_id" character varying, CONSTRAINT "REL_ad38004da6163a85bb1c204f62" UNIQUE ("discount_rule_id"), CONSTRAINT "PK_d05d8712e429673e459e7f1cddb" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_087926f6fec32903be3c8eedfa" ON "discount" ("code") `
    )
    await queryRunner.query(
      `CREATE TABLE "payment_session" ("id" character varying NOT NULL, "provider_id" character varying NOT NULL, "data" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cart_id" character varying, CONSTRAINT "PK_a1a91b20f7f3b1e5afb5485cbcd" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" character varying NOT NULL, "amount" integer NOT NULL, "currency_code" character varying NOT NULL, "amount_refunded" integer NOT NULL, "provider_id" character varying NOT NULL, "data" jsonb NOT NULL, "captured_at" TIMESTAMP, "canceled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "cart_id" character varying, "order_id" character varying, CONSTRAINT "REL_4665f17abc1e81dd58330e5854" UNIQUE ("cart_id"), CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "cart" ("id" character varying NOT NULL, "email" character varying NOT NULL, "billing_address_id" character varying, "shipping_address_id" character varying, "customer_id" character varying, "payment_id" character varying, "is_swap" boolean NOT NULL, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "region_id" character varying, CONSTRAINT "REL_9d1a161434c610aae7c3df2dc7" UNIQUE ("payment_id"), CONSTRAINT "PK_c524ec48751b9b5bcfbf6e59be7" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "shipping_method" ("id" character varying NOT NULL, "shipping_option_id" character varying NOT NULL, "order_id" character varying, "cart_id" character varying, "swap_id" character varying, "return_id" character varying, "price" integer NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "REL_1d9ad62038998c3a85c77a53cf" UNIQUE ("return_id"), CONSTRAINT "CHK_64c6812fe7815be30d688df513" CHECK ("price" >= 0), CONSTRAINT "CHK_3c00b878c1426d119cd70aa065" CHECK ("order_id" IS NOT NULL OR "cart_id" IS NOT NULL OR "swap_id" IS NOT NULL OR "return_id" IS NOT NULL), CONSTRAINT "PK_b9b0adfad3c6b99229c1e7d4865" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_fc963e94854bff2714ca84cd19" ON "shipping_method" ("shipping_option_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_5267705a43d547e232535b656c" ON "shipping_method" ("order_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_d92993a7d554d84571f4eea1d1" ON "shipping_method" ("cart_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_fb94fa8d5ca940daa2a58139f8" ON "shipping_method" ("swap_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_1d9ad62038998c3a85c77a53cf" ON "shipping_method" ("return_id") `
    )
    await queryRunner.query(
      `CREATE TYPE "return_status_enum" AS ENUM('requested', 'received', ' requires_action')`
    )
    await queryRunner.query(
      `CREATE TABLE "return" ("id" character varying NOT NULL, "status" "return_status_enum" NOT NULL, "swap_id" character varying, "order_id" character varying, "refund_amount" integer NOT NULL, "received_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, CONSTRAINT "PK_c8ad68d13e76d75d803b5aeebc4" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "swap_fulfillment_status_enum" AS ENUM('not_fulfilled', 'fulfilled', 'requires_action')`
    )
    await queryRunner.query(
      `CREATE TYPE "swap_payment_status_enum" AS ENUM('not_paid', 'awaiting', 'captured', 'partially_refunded', 'refunded', 'requires_action')`
    )
    await queryRunner.query(
      `CREATE TABLE "swap" ("id" character varying NOT NULL, "fulfillment_status" "swap_fulfillment_status_enum" NOT NULL, "payment_status" "swap_payment_status_enum" NOT NULL, "shipping_address_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, "order_id" character varying, "return_id" character varying, "payment_id" character varying, "cart_id" character varying, CONSTRAINT "REL_ebd3e02011ca6e072302e569d5" UNIQUE ("return_id"), CONSTRAINT "REL_2022bc04efc55378d29def1598" UNIQUE ("payment_id"), CONSTRAINT "REL_402e8182bc553e082f6380020b" UNIQUE ("cart_id"), CONSTRAINT "PK_4a10d0f359339acef77e7f986d9" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "line_item" ("id" character varying NOT NULL, "cart_id" character varying, "order_id" character varying, "swap_id" character varying, "title" character varying NOT NULL, "description" character varying, "thumbnail" character varying, "is_giftcard" boolean NOT NULL DEFAULT false, "should_merge" boolean NOT NULL DEFAULT true, "allow_discounts" boolean NOT NULL DEFAULT true, "unit_price" integer NOT NULL, "variant_id" character varying NOT NULL, "quantity" integer NOT NULL, "fulfilled_quantity" integer, "returned_quantity" integer, "shipped_quantity" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, CONSTRAINT "CHK_64eef00a5064887634f1680866" CHECK ("quantity" > 0), CONSTRAINT "CHK_91f40396d847f6ecfd9f752bf8" CHECK ("returned_quantity" <= "quantity"), CONSTRAINT "CHK_0cd85e15610d11b553d5e8fda6" CHECK ("shipped_quantity" <= "fulfilled_quantity"), CONSTRAINT "CHK_c61716c68f5ad5de2834c827d3" CHECK ("fulfilled_quantity" <= "quantity"), CONSTRAINT "PK_cce6b13e67fa506d1d9618ac68b" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_27283ee631862266d0f1c68064" ON "line_item" ("cart_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_43a2b24495fe1d9fc2a9c835bc" ON "line_item" ("order_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3fa354d8d1233ff81097b2fcb6" ON "line_item" ("swap_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_5371cbaa3be5200f373d24e3d5" ON "line_item" ("variant_id") `
    )
    await queryRunner.query(
      `CREATE TYPE "order_status_enum" AS ENUM('pending', 'completed', 'archived', 'canceled', 'requires_action')`
    )
    await queryRunner.query(
      `CREATE TYPE "order_fulfillment_status_enum" AS ENUM('not_fulfilled', 'partially_fulfilled', 'fulfilled', 'partially_returned', 'returned', 'requires_action')`
    )
    await queryRunner.query(
      `CREATE TYPE "order_payment_status_enum" AS ENUM('not_paid', 'awaiting', 'captured', 'partially_refunded', 'refunded', 'requires_action')`
    )
    await queryRunner.query(
      `CREATE TABLE "order" ("id" character varying NOT NULL, "status" "order_status_enum" NOT NULL, "fulfillment_status" "order_fulfillment_status_enum" NOT NULL, "payment_status" "order_payment_status_enum" NOT NULL, "display_id" SERIAL NOT NULL, "customer_id" character varying NOT NULL, "email" character varying NOT NULL, "billing_address_id" character varying, "shipping_address_id" character varying, "region_id" character varying NOT NULL, "currency_code" character varying NOT NULL, "tax_rate" integer NOT NULL, "canceled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "cart_id" character varying, CONSTRAINT "REL_c99a206eb11ad45f6b7f04f2dc" UNIQUE ("cart_id"), CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "customer" ("id" character varying NOT NULL, "email" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "billing_address_id" character varying, "password_hash" character varying NOT NULL, "phone" character varying NOT NULL, "has_account" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "REL_8abe81b9aac151ae60bf507ad1" UNIQUE ("billing_address_id"), CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fdb2f3ad8115da4c7718109a6e" ON "customer" ("email") `
    )
    await queryRunner.query(
      `CREATE TABLE "address" ("id" character varying NOT NULL, "customer_id" character varying, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "address_1" character varying NOT NULL, "address_2" character varying NOT NULL, "city" character varying NOT NULL, "country_code" character varying NOT NULL, "province" character varying NOT NULL, "postal_code" character varying NOT NULL, "phone" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "dynamic_discount" ("id" character varying NOT NULL, "code" character varying NOT NULL, "is_disabled" character varying NOT NULL, "discount_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_0b5298779da5d9249fe938ac049" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_beca97d70f1695477f33833a0d" ON "dynamic_discount" ("discount_id") `
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bacd97dfd7195c228a92167726" ON "dynamic_discount" ("code", "discount_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "gift_card" ("id" character varying NOT NULL, "code" character varying NOT NULL, "value" integer NOT NULL, "balance" integer NOT NULL, "is_disabled" boolean NOT NULL DEFAULT false, "ends_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "metadata" jsonb, CONSTRAINT "PK_af4e338d2d41035042843ad641f" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_53cb5605fa42e82b4d47b47bda" ON "gift_card" ("code") `
    )
    await queryRunner.query(
      `CREATE TABLE "idempotency_key" ("id" character varying NOT NULL, "idempotency_key" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "locked_at" TIMESTAMP, "request_method" character varying NOT NULL, "request_params" jsonb NOT NULL, "request_path" character varying NOT NULL, "response_code" integer NOT NULL, "response_body" jsonb NOT NULL, "recovery_point" character varying NOT NULL DEFAULT 'string', CONSTRAINT "PK_213f125e14469be304f9ff1d452" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a421bf4588d0004a9b0c0fe84f" ON "idempotency_key" ("idempotency_key") `
    )
    await queryRunner.query(
      `CREATE TABLE "oauth" ("id" character varying NOT NULL, "display_name" character varying NOT NULL, "application_name" character varying NOT NULL, "install_url" character varying, "uninstall_url" character varying, "data" jsonb, CONSTRAINT "PK_a957b894e50eb16b969c0640a8d" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c49c061b1a686843c5d673506f" ON "oauth" ("application_name") `
    )
    await queryRunner.query(
      `CREATE TABLE "staged_job" ("id" character varying NOT NULL, "event_name" character varying NOT NULL, "data" jsonb NOT NULL, CONSTRAINT "PK_9a28fb48c46c5509faf43ac8c8d" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "store" ("id" character varying NOT NULL, "name" character varying NOT NULL DEFAULT 'Medusa Store', "default_currency" character varying NOT NULL DEFAULT 'usd', "currencies" jsonb NOT NULL DEFAULT '[]', "swap_link_template" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, CONSTRAINT "PK_f3172007d4de5ae8e7692759d79" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "region_payment_providers" ("region_id" character varying NOT NULL, "provider_id" character varying NOT NULL, CONSTRAINT "PK_9fa1e69914d3dd752de6b1da407" PRIMARY KEY ("region_id", "provider_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_8aaa78ba90d3802edac317df86" ON "region_payment_providers" ("region_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3a6947180aeec283cd92c59ebb" ON "region_payment_providers" ("provider_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "region_fulfillment_providers" ("region_id" character varying NOT NULL, "provider_id" character varying NOT NULL, CONSTRAINT "PK_5b7d928a1fb50d6803868cfab3a" PRIMARY KEY ("region_id", "provider_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_c556e14eff4d6f03db593df955" ON "region_fulfillment_providers" ("region_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_37f361c38a18d12a3fa3158d0c" ON "region_fulfillment_providers" ("provider_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "product_images" ("product_id" character varying NOT NULL, "image_id" character varying NOT NULL, CONSTRAINT "PK_10de97980da2e939c4c0e8423f2" PRIMARY KEY ("product_id", "image_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_4f166bb8c2bfcef2498d97b406" ON "product_images" ("product_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_2212515ba306c79f42c46a99db" ON "product_images" ("image_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "discount_rule_products" ("discount_rule_id" character varying NOT NULL, "product_id" character varying NOT NULL, CONSTRAINT "PK_351c8c92f5d27283c445cd022ee" PRIMARY KEY ("discount_rule_id", "product_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_4e0739e5f0244c08d41174ca08" ON "discount_rule_products" ("discount_rule_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_be66106a673b88a81c603abe7e" ON "discount_rule_products" ("product_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "discount_regions" ("discount_id" character varying NOT NULL, "region_id" character varying NOT NULL, CONSTRAINT "PK_15974566a8b6e04a7c754e85b75" PRIMARY KEY ("discount_id", "region_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_f4194aa81073f3fab8aa86906f" ON "discount_regions" ("discount_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_a21a7ffbe420d492eb46c305fe" ON "discount_regions" ("region_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "cart_discounts" ("cart_id" character varying NOT NULL, "discount_id" character varying NOT NULL, CONSTRAINT "PK_10bd412c9071ccc0cf555afd9bb" PRIMARY KEY ("cart_id", "discount_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_6680319ebe1f46d18f106191d5" ON "cart_discounts" ("cart_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_8df75ef4f35f217768dc113545" ON "cart_discounts" ("discount_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "order_discounts" ("order_id" character varying NOT NULL, "discount_id" character varying NOT NULL, CONSTRAINT "PK_a7418714ffceebc125bf6d8fcfe" PRIMARY KEY ("order_id", "discount_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e7b488cebe333f449398769b2c" ON "order_discounts" ("order_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_0fc1ec4e3db9001ad60c19daf1" ON "order_discounts" ("discount_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "giftcard_regions" ("gift_card_id" character varying NOT NULL, "region_id" character varying NOT NULL, CONSTRAINT "PK_d2c883403d15b3269e104038999" PRIMARY KEY ("gift_card_id", "region_id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_e5723365c16eea8bb78c832d26" ON "giftcard_regions" ("gift_card_id") `
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9a52a00fe8f9ab2b710b1c634f" ON "giftcard_regions" ("region_id") `
    )
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "REL_8abe81b9aac151ae60bf507ad1"`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "billing_address_id"`
    )
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "phone"`)
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "has_account"`)
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "billing_address_id" character varying`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_8abe81b9aac151ae60bf507ad15" UNIQUE ("billing_address_id")`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "phone" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "has_account" boolean NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "api_token" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment_item" ADD CONSTRAINT "FK_a033f83cc6bd7701a5687ab4b38" FOREIGN KEY ("fulfillment_id") REFERENCES "fulfillment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment_item" ADD CONSTRAINT "FK_e13ff60e74206b747a1896212d1" FOREIGN KEY ("item_id") REFERENCES "line_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment" ADD CONSTRAINT "FK_a52e234f729db789cf473297a5c" FOREIGN KEY ("swap_id") REFERENCES "swap"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment" ADD CONSTRAINT "FK_f129acc85e346a10eed12b86fca" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment" ADD CONSTRAINT "FK_beb35a6de60a6c4f91d5ae57e44" FOREIGN KEY ("provider_id") REFERENCES "fulfillment_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "return_item" ADD CONSTRAINT "FK_7edab75b4fc88ea6d4f2574f087" FOREIGN KEY ("return_id") REFERENCES "return"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "return_item" ADD CONSTRAINT "FK_87774591f44564effd8039d7162" FOREIGN KEY ("item_id") REFERENCES "line_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "product_option_value" ADD CONSTRAINT "FK_cdf4388f294b30a25c627d69fe9" FOREIGN KEY ("option_id") REFERENCES "product_option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "product_option_value" ADD CONSTRAINT "FK_7234ed737ff4eb1b6ae6e6d7b01" FOREIGN KEY ("variant_id") REFERENCES "product_option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "product_option" ADD CONSTRAINT "FK_e634fca34f6b594b87fdbee95f6" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "money_amount" ADD CONSTRAINT "FK_17a06d728e4cfbc5bd2ddb70af0" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "product_variant" ADD CONSTRAINT "FK_ca67dd080aac5ecf99609960cd2" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option_requirement" ADD CONSTRAINT "FK_012a62ba743e427b5ebe9dee18e" FOREIGN KEY ("shipping_option_id") REFERENCES "shipping_option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option" ADD CONSTRAINT "FK_5c58105f1752fca0f4ce69f4663" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option" ADD CONSTRAINT "FK_c951439af4c98bf2bd7fb8726cd" FOREIGN KEY ("profile_id") REFERENCES "shipping_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option" ADD CONSTRAINT "FK_a0e206bfaed3cb63c1860917347" FOREIGN KEY ("provider_id") REFERENCES "fulfillment_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "product" ADD CONSTRAINT "FK_80823b7ae866dc5acae2dac6d2c" FOREIGN KEY ("profile_id") REFERENCES "shipping_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "discount" ADD CONSTRAINT "FK_ad38004da6163a85bb1c204f621" FOREIGN KEY ("discount_rule_id") REFERENCES "discount_rule"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "payment_session" ADD CONSTRAINT "FK_d25ba0787e1510ddc5d442ebcfa" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_4665f17abc1e81dd58330e58542" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_f5221735ace059250daac9d9803" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" ADD CONSTRAINT "FK_6b9c66b5e36f7c827dfaa092f94" FOREIGN KEY ("billing_address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" ADD CONSTRAINT "FK_ced15a9a695d2b5db9dabce763d" FOREIGN KEY ("shipping_address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" ADD CONSTRAINT "FK_484c329f4783be4e18e5e2ff090" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" ADD CONSTRAINT "FK_242205c81c1152fab1b6e848470" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" ADD CONSTRAINT "FK_9d1a161434c610aae7c3df2dc7e" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" ADD CONSTRAINT "FK_5267705a43d547e232535b656c2" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" ADD CONSTRAINT "FK_d92993a7d554d84571f4eea1d13" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" ADD CONSTRAINT "FK_fb94fa8d5ca940daa2a58139f86" FOREIGN KEY ("swap_id") REFERENCES "swap"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" ADD CONSTRAINT "FK_1d9ad62038998c3a85c77a53cfb" FOREIGN KEY ("return_id") REFERENCES "return"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" ADD CONSTRAINT "FK_fc963e94854bff2714ca84cd193" FOREIGN KEY ("shipping_option_id") REFERENCES "shipping_option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "return" ADD CONSTRAINT "FK_d4bd17f918fc6c332b74a368c36" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" ADD CONSTRAINT "FK_52dd74e8c989aa5665ad2852b8b" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" ADD CONSTRAINT "FK_ebd3e02011ca6e072302e569d52" FOREIGN KEY ("return_id") REFERENCES "return"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" ADD CONSTRAINT "FK_2022bc04efc55378d29def1598b" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" ADD CONSTRAINT "FK_f5189d38b3d3bd496618bf54c57" FOREIGN KEY ("shipping_address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" ADD CONSTRAINT "FK_402e8182bc553e082f6380020b4" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" ADD CONSTRAINT "FK_27283ee631862266d0f1c680646" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" ADD CONSTRAINT "FK_43a2b24495fe1d9fc2a9c835bc7" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" ADD CONSTRAINT "FK_3fa354d8d1233ff81097b2fcb6b" FOREIGN KEY ("swap_id") REFERENCES "swap"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" ADD CONSTRAINT "FK_5371cbaa3be5200f373d24e3d5b" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_c99a206eb11ad45f6b7f04f2dcc" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_cd7812c96209c5bdd48a6b858b0" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_5568d3b9ce9f7abeeb37511ecf2" FOREIGN KEY ("billing_address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_19b0c6293443d1b464f604c3316" FOREIGN KEY ("shipping_address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_e1fcce2b18dbcdbe0a5ba9a68b8" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "FK_8abe81b9aac151ae60bf507ad15" FOREIGN KEY ("billing_address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "address" ADD CONSTRAINT "FK_9c9614b2f9d01665800ea8dbff7" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "dynamic_discount" ADD CONSTRAINT "FK_beca97d70f1695477f33833a0d2" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "region_payment_providers" ADD CONSTRAINT "FK_8aaa78ba90d3802edac317df869" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "region_payment_providers" ADD CONSTRAINT "FK_3a6947180aeec283cd92c59ebb0" FOREIGN KEY ("provider_id") REFERENCES "payment_provider"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "region_fulfillment_providers" ADD CONSTRAINT "FK_c556e14eff4d6f03db593df955e" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "region_fulfillment_providers" ADD CONSTRAINT "FK_37f361c38a18d12a3fa3158d0cf" FOREIGN KEY ("provider_id") REFERENCES "fulfillment_provider"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_2212515ba306c79f42c46a99db7" FOREIGN KEY ("image_id") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_rule_products" ADD CONSTRAINT "FK_4e0739e5f0244c08d41174ca08a" FOREIGN KEY ("discount_rule_id") REFERENCES "discount_rule"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_rule_products" ADD CONSTRAINT "FK_be66106a673b88a81c603abe7eb" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_regions" ADD CONSTRAINT "FK_f4194aa81073f3fab8aa86906ff" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_regions" ADD CONSTRAINT "FK_a21a7ffbe420d492eb46c305fec" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cart_discounts" ADD CONSTRAINT "FK_6680319ebe1f46d18f106191d59" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cart_discounts" ADD CONSTRAINT "FK_8df75ef4f35f217768dc1135458" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "order_discounts" ADD CONSTRAINT "FK_e7b488cebe333f449398769b2cc" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "order_discounts" ADD CONSTRAINT "FK_0fc1ec4e3db9001ad60c19daf16" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "giftcard_regions" ADD CONSTRAINT "FK_e5723365c16eea8bb78c832d26a" FOREIGN KEY ("gift_card_id") REFERENCES "gift_card"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "giftcard_regions" ADD CONSTRAINT "FK_9a52a00fe8f9ab2b710b1c634f4" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "giftcard_regions" DROP CONSTRAINT "FK_9a52a00fe8f9ab2b710b1c634f4"`
    )
    await queryRunner.query(
      `ALTER TABLE "giftcard_regions" DROP CONSTRAINT "FK_e5723365c16eea8bb78c832d26a"`
    )
    await queryRunner.query(
      `ALTER TABLE "order_discounts" DROP CONSTRAINT "FK_0fc1ec4e3db9001ad60c19daf16"`
    )
    await queryRunner.query(
      `ALTER TABLE "order_discounts" DROP CONSTRAINT "FK_e7b488cebe333f449398769b2cc"`
    )
    await queryRunner.query(
      `ALTER TABLE "cart_discounts" DROP CONSTRAINT "FK_8df75ef4f35f217768dc1135458"`
    )
    await queryRunner.query(
      `ALTER TABLE "cart_discounts" DROP CONSTRAINT "FK_6680319ebe1f46d18f106191d59"`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_regions" DROP CONSTRAINT "FK_a21a7ffbe420d492eb46c305fec"`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_regions" DROP CONSTRAINT "FK_f4194aa81073f3fab8aa86906ff"`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_rule_products" DROP CONSTRAINT "FK_be66106a673b88a81c603abe7eb"`
    )
    await queryRunner.query(
      `ALTER TABLE "discount_rule_products" DROP CONSTRAINT "FK_4e0739e5f0244c08d41174ca08a"`
    )
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_2212515ba306c79f42c46a99db7"`
    )
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`
    )
    await queryRunner.query(
      `ALTER TABLE "region_fulfillment_providers" DROP CONSTRAINT "FK_37f361c38a18d12a3fa3158d0cf"`
    )
    await queryRunner.query(
      `ALTER TABLE "region_fulfillment_providers" DROP CONSTRAINT "FK_c556e14eff4d6f03db593df955e"`
    )
    await queryRunner.query(
      `ALTER TABLE "region_payment_providers" DROP CONSTRAINT "FK_3a6947180aeec283cd92c59ebb0"`
    )
    await queryRunner.query(
      `ALTER TABLE "region_payment_providers" DROP CONSTRAINT "FK_8aaa78ba90d3802edac317df869"`
    )
    await queryRunner.query(
      `ALTER TABLE "dynamic_discount" DROP CONSTRAINT "FK_beca97d70f1695477f33833a0d2"`
    )
    await queryRunner.query(
      `ALTER TABLE "address" DROP CONSTRAINT "FK_9c9614b2f9d01665800ea8dbff7"`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "FK_8abe81b9aac151ae60bf507ad15"`
    )
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_e1fcce2b18dbcdbe0a5ba9a68b8"`
    )
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_19b0c6293443d1b464f604c3316"`
    )
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_5568d3b9ce9f7abeeb37511ecf2"`
    )
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_cd7812c96209c5bdd48a6b858b0"`
    )
    await queryRunner.query(
      `ALTER TABLE "order" DROP CONSTRAINT "FK_c99a206eb11ad45f6b7f04f2dcc"`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" DROP CONSTRAINT "FK_5371cbaa3be5200f373d24e3d5b"`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" DROP CONSTRAINT "FK_3fa354d8d1233ff81097b2fcb6b"`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" DROP CONSTRAINT "FK_43a2b24495fe1d9fc2a9c835bc7"`
    )
    await queryRunner.query(
      `ALTER TABLE "line_item" DROP CONSTRAINT "FK_27283ee631862266d0f1c680646"`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" DROP CONSTRAINT "FK_402e8182bc553e082f6380020b4"`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" DROP CONSTRAINT "FK_f5189d38b3d3bd496618bf54c57"`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" DROP CONSTRAINT "FK_2022bc04efc55378d29def1598b"`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" DROP CONSTRAINT "FK_ebd3e02011ca6e072302e569d52"`
    )
    await queryRunner.query(
      `ALTER TABLE "swap" DROP CONSTRAINT "FK_52dd74e8c989aa5665ad2852b8b"`
    )
    await queryRunner.query(
      `ALTER TABLE "return" DROP CONSTRAINT "FK_d4bd17f918fc6c332b74a368c36"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" DROP CONSTRAINT "FK_fc963e94854bff2714ca84cd193"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" DROP CONSTRAINT "FK_1d9ad62038998c3a85c77a53cfb"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" DROP CONSTRAINT "FK_fb94fa8d5ca940daa2a58139f86"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" DROP CONSTRAINT "FK_d92993a7d554d84571f4eea1d13"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_method" DROP CONSTRAINT "FK_5267705a43d547e232535b656c2"`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" DROP CONSTRAINT "FK_9d1a161434c610aae7c3df2dc7e"`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" DROP CONSTRAINT "FK_242205c81c1152fab1b6e848470"`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" DROP CONSTRAINT "FK_484c329f4783be4e18e5e2ff090"`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" DROP CONSTRAINT "FK_ced15a9a695d2b5db9dabce763d"`
    )
    await queryRunner.query(
      `ALTER TABLE "cart" DROP CONSTRAINT "FK_6b9c66b5e36f7c827dfaa092f94"`
    )
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_f5221735ace059250daac9d9803"`
    )
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_4665f17abc1e81dd58330e58542"`
    )
    await queryRunner.query(
      `ALTER TABLE "payment_session" DROP CONSTRAINT "FK_d25ba0787e1510ddc5d442ebcfa"`
    )
    await queryRunner.query(
      `ALTER TABLE "discount" DROP CONSTRAINT "FK_ad38004da6163a85bb1c204f621"`
    )
    await queryRunner.query(
      `ALTER TABLE "product" DROP CONSTRAINT "FK_80823b7ae866dc5acae2dac6d2c"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option" DROP CONSTRAINT "FK_a0e206bfaed3cb63c1860917347"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option" DROP CONSTRAINT "FK_c951439af4c98bf2bd7fb8726cd"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option" DROP CONSTRAINT "FK_5c58105f1752fca0f4ce69f4663"`
    )
    await queryRunner.query(
      `ALTER TABLE "shipping_option_requirement" DROP CONSTRAINT "FK_012a62ba743e427b5ebe9dee18e"`
    )
    await queryRunner.query(
      `ALTER TABLE "product_variant" DROP CONSTRAINT "FK_ca67dd080aac5ecf99609960cd2"`
    )
    await queryRunner.query(
      `ALTER TABLE "money_amount" DROP CONSTRAINT "FK_17a06d728e4cfbc5bd2ddb70af0"`
    )
    await queryRunner.query(
      `ALTER TABLE "product_option" DROP CONSTRAINT "FK_e634fca34f6b594b87fdbee95f6"`
    )
    await queryRunner.query(
      `ALTER TABLE "product_option_value" DROP CONSTRAINT "FK_7234ed737ff4eb1b6ae6e6d7b01"`
    )
    await queryRunner.query(
      `ALTER TABLE "product_option_value" DROP CONSTRAINT "FK_cdf4388f294b30a25c627d69fe9"`
    )
    await queryRunner.query(
      `ALTER TABLE "return_item" DROP CONSTRAINT "FK_87774591f44564effd8039d7162"`
    )
    await queryRunner.query(
      `ALTER TABLE "return_item" DROP CONSTRAINT "FK_7edab75b4fc88ea6d4f2574f087"`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment" DROP CONSTRAINT "FK_beb35a6de60a6c4f91d5ae57e44"`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment" DROP CONSTRAINT "FK_f129acc85e346a10eed12b86fca"`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment" DROP CONSTRAINT "FK_a52e234f729db789cf473297a5c"`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment_item" DROP CONSTRAINT "FK_e13ff60e74206b747a1896212d1"`
    )
    await queryRunner.query(
      `ALTER TABLE "fulfillment_item" DROP CONSTRAINT "FK_a033f83cc6bd7701a5687ab4b38"`
    )
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "api_token"`)
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "has_account"`)
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "phone"`)
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_8abe81b9aac151ae60bf507ad15"`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "billing_address_id"`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "has_account" boolean NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "phone" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "billing_address_id" character varying`
    )
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "REL_8abe81b9aac151ae60bf507ad1" UNIQUE ("billing_address_id")`
    )
    await queryRunner.query(`DROP INDEX "IDX_9a52a00fe8f9ab2b710b1c634f"`)
    await queryRunner.query(`DROP INDEX "IDX_e5723365c16eea8bb78c832d26"`)
    await queryRunner.query(`DROP TABLE "giftcard_regions"`)
    await queryRunner.query(`DROP INDEX "IDX_0fc1ec4e3db9001ad60c19daf1"`)
    await queryRunner.query(`DROP INDEX "IDX_e7b488cebe333f449398769b2c"`)
    await queryRunner.query(`DROP TABLE "order_discounts"`)
    await queryRunner.query(`DROP INDEX "IDX_8df75ef4f35f217768dc113545"`)
    await queryRunner.query(`DROP INDEX "IDX_6680319ebe1f46d18f106191d5"`)
    await queryRunner.query(`DROP TABLE "cart_discounts"`)
    await queryRunner.query(`DROP INDEX "IDX_a21a7ffbe420d492eb46c305fe"`)
    await queryRunner.query(`DROP INDEX "IDX_f4194aa81073f3fab8aa86906f"`)
    await queryRunner.query(`DROP TABLE "discount_regions"`)
    await queryRunner.query(`DROP INDEX "IDX_be66106a673b88a81c603abe7e"`)
    await queryRunner.query(`DROP INDEX "IDX_4e0739e5f0244c08d41174ca08"`)
    await queryRunner.query(`DROP TABLE "discount_rule_products"`)
    await queryRunner.query(`DROP INDEX "IDX_2212515ba306c79f42c46a99db"`)
    await queryRunner.query(`DROP INDEX "IDX_4f166bb8c2bfcef2498d97b406"`)
    await queryRunner.query(`DROP TABLE "product_images"`)
    await queryRunner.query(`DROP INDEX "IDX_37f361c38a18d12a3fa3158d0c"`)
    await queryRunner.query(`DROP INDEX "IDX_c556e14eff4d6f03db593df955"`)
    await queryRunner.query(`DROP TABLE "region_fulfillment_providers"`)
    await queryRunner.query(`DROP INDEX "IDX_3a6947180aeec283cd92c59ebb"`)
    await queryRunner.query(`DROP INDEX "IDX_8aaa78ba90d3802edac317df86"`)
    await queryRunner.query(`DROP TABLE "region_payment_providers"`)
    await queryRunner.query(`DROP TABLE "store"`)
    await queryRunner.query(`DROP TABLE "staged_job"`)
    await queryRunner.query(`DROP INDEX "IDX_c49c061b1a686843c5d673506f"`)
    await queryRunner.query(`DROP TABLE "oauth"`)
    await queryRunner.query(`DROP INDEX "IDX_a421bf4588d0004a9b0c0fe84f"`)
    await queryRunner.query(`DROP TABLE "idempotency_key"`)
    await queryRunner.query(`DROP INDEX "IDX_53cb5605fa42e82b4d47b47bda"`)
    await queryRunner.query(`DROP TABLE "gift_card"`)
    await queryRunner.query(`DROP INDEX "IDX_bacd97dfd7195c228a92167726"`)
    await queryRunner.query(`DROP INDEX "IDX_beca97d70f1695477f33833a0d"`)
    await queryRunner.query(`DROP TABLE "dynamic_discount"`)
    await queryRunner.query(`DROP TABLE "address"`)
    await queryRunner.query(`DROP INDEX "IDX_fdb2f3ad8115da4c7718109a6e"`)
    await queryRunner.query(`DROP TABLE "customer"`)
    await queryRunner.query(`DROP TABLE "order"`)
    await queryRunner.query(`DROP TYPE "order_payment_status_enum"`)
    await queryRunner.query(`DROP TYPE "order_fulfillment_status_enum"`)
    await queryRunner.query(`DROP TYPE "order_status_enum"`)
    await queryRunner.query(`DROP INDEX "IDX_5371cbaa3be5200f373d24e3d5"`)
    await queryRunner.query(`DROP INDEX "IDX_3fa354d8d1233ff81097b2fcb6"`)
    await queryRunner.query(`DROP INDEX "IDX_43a2b24495fe1d9fc2a9c835bc"`)
    await queryRunner.query(`DROP INDEX "IDX_27283ee631862266d0f1c68064"`)
    await queryRunner.query(`DROP TABLE "line_item"`)
    await queryRunner.query(`DROP TABLE "swap"`)
    await queryRunner.query(`DROP TYPE "swap_payment_status_enum"`)
    await queryRunner.query(`DROP TYPE "swap_fulfillment_status_enum"`)
    await queryRunner.query(`DROP TABLE "return"`)
    await queryRunner.query(`DROP TYPE "return_status_enum"`)
    await queryRunner.query(`DROP INDEX "IDX_1d9ad62038998c3a85c77a53cf"`)
    await queryRunner.query(`DROP INDEX "IDX_fb94fa8d5ca940daa2a58139f8"`)
    await queryRunner.query(`DROP INDEX "IDX_d92993a7d554d84571f4eea1d1"`)
    await queryRunner.query(`DROP INDEX "IDX_5267705a43d547e232535b656c"`)
    await queryRunner.query(`DROP INDEX "IDX_fc963e94854bff2714ca84cd19"`)
    await queryRunner.query(`DROP TABLE "shipping_method"`)
    await queryRunner.query(`DROP TABLE "cart"`)
    await queryRunner.query(`DROP TABLE "payment"`)
    await queryRunner.query(`DROP TABLE "payment_session"`)
    await queryRunner.query(`DROP INDEX "IDX_087926f6fec32903be3c8eedfa"`)
    await queryRunner.query(`DROP TABLE "discount"`)
    await queryRunner.query(`DROP TABLE "discount_rule"`)
    await queryRunner.query(`DROP TYPE "discount_rule_allocation_enum"`)
    await queryRunner.query(`DROP TYPE "discount_rule_type_enum"`)
    await queryRunner.query(`DROP INDEX "IDX_db7355f7bd36c547c8a4f539e5"`)
    await queryRunner.query(`DROP TABLE "product"`)
    await queryRunner.query(`DROP TABLE "shipping_profile"`)
    await queryRunner.query(`DROP TYPE "shipping_profile_type_enum"`)
    await queryRunner.query(`DROP TABLE "shipping_option"`)
    await queryRunner.query(`DROP TYPE "shipping_option_price_type_enum"`)
    await queryRunner.query(`DROP TABLE "shipping_option_requirement"`)
    await queryRunner.query(`DROP TYPE "shipping_option_requirement_type_enum"`)
    await queryRunner.query(`DROP INDEX "IDX_9db95c4b71f632fc93ecbc3d8b"`)
    await queryRunner.query(`DROP INDEX "IDX_f4dc2c0888b66d547c175f090e"`)
    await queryRunner.query(`DROP TABLE "product_variant"`)
    await queryRunner.query(`DROP TABLE "money_amount"`)
    await queryRunner.query(`DROP TABLE "product_option"`)
    await queryRunner.query(`DROP INDEX "IDX_b222db89e432f07f33ceff8441"`)
    await queryRunner.query(`DROP INDEX "IDX_cdf4388f294b30a25c627d69fe"`)
    await queryRunner.query(`DROP TABLE "product_option_value"`)
    await queryRunner.query(`DROP TABLE "image"`)
    await queryRunner.query(`DROP TABLE "region"`)
    await queryRunner.query(`DROP TABLE "payment_provider"`)
    await queryRunner.query(`DROP TABLE "return_item"`)
    await queryRunner.query(`DROP TABLE "fulfillment"`)
    await queryRunner.query(`DROP TABLE "fulfillment_item"`)
    await queryRunner.query(`DROP TABLE "fulfillment_provider"`)
  }
}
