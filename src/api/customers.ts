import { http } from "./client";

// Backend (com.starsoft.voint.crm.dto.CustomerResponse) sahe adlari ile birebir ustuste
// dusur — adapter lazim deyil. callCount backend terefinde her muraciyetde hesablanir.
export interface Customer {
  id: string;
  tenantId: string;
  phoneNumber: string;
  name: string | null;
  notes: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  callCount: number;
}

export interface CustomerInput {
  phoneNumber: string;
  name?: string;
  notes?: string;
}

export async function getCustomers(tenantId: string): Promise<Customer[]> {
  const { data } = await http.get<Customer[]>(`/tenants/${tenantId}/customers`);
  return data;
}

export async function createCustomer(tenantId: string, input: CustomerInput): Promise<Customer> {
  const { data } = await http.post<Customer>(`/tenants/${tenantId}/customers`, input);
  return data;
}

/** PATCH semantikasi: verilməyən sahələr toxunulmaz qalır. */
export async function updateCustomer(
  tenantId: string,
  customerId: string,
  input: Partial<CustomerInput>,
): Promise<Customer> {
  const { data } = await http.patch<Customer>(
    `/tenants/${tenantId}/customers/${customerId}`,
    input,
  );
  return data;
}
