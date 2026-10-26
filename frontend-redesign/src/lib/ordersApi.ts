// Integration boundary for the future backend.
//
// Nothing here talks to a server yet. The UI checks `ordersApi.connected` and,
// while false, never shows "order submitted", an order reference or live
// tracking. When the backend exists, implement `OrdersApi` against
// VITE_ORDERS_API_URL and flip `connected`.
//
// Backend requirements (NOT implemented in this frontend):
//  - server-side validation of every field and of prices (never trust client totals)
//  - rate limiting + bot/abuse protection on submit and track endpoints
//  - unguessable order references; tracking must require the reference AND a second
//    factor (e.g. the order email/phone) to prevent enumeration
//  - authentication/authorisation + server-managed sessions for admin and any accounts
//  - private, malware-scanned storage with signed URLs for document uploads
//  - admin payment confirmation, audit logging, and email notifications sent server-side
import type { Quote } from "./pricing";
import type { Details } from "./validation";

export interface SubmittedOrder {
  reference: string;
}
export interface OrderStatus {
  stage: string;
  updatedAt: string;
}

export interface OrdersApi {
  readonly connected: boolean;
  submit(quote: Quote, details: Details): Promise<SubmittedOrder>;
  track(reference: string, email: string): Promise<OrderStatus>;
}

export class NotConnectedError extends Error {
  constructor() {
    super("Orders API is not connected");
    this.name = "NotConnectedError";
  }
}

export const ordersApi: OrdersApi = {
  connected: false,
  submit: () => Promise.reject(new NotConnectedError()),
  track: () => Promise.reject(new NotConnectedError()),
};
