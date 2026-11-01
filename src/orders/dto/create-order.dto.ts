export interface CreateOrderItemDto {
  product_id: number;
  quantity?: number;
}

export interface CreateOrderDto {
  user_id?: number;
  product_id?: number;
  quantity?: number;
  customer_name?: string;
  customer_email?: string;
  status?: string;
  items?: CreateOrderItemDto[];
}

export interface UpdateOrderStatusDto {
  status: string;
}
