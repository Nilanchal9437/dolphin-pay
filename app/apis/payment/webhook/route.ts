import { NextRequest, NextResponse } from "next/server";
import OddoAxios from "@/src/libs/Oddo";
import { v4 as uuidv4 } from "uuid";
import VoucherAxios from "@/src/libs/Voucher";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const { searchParams } = new URL(req.url);

    const paramsObject = Object.fromEntries(searchParams.entries());

    const { salesOderId, voucher, customerEmail, customerPhone, customerName } =
      paramsObject;
    const { payment_id, status, payment_reference } = body;

    console.log("Received webhook with body:", voucher);

    const vouchers = JSON.parse(voucher || "[]");

    // ✅ get query params

    const uuid = uuidv4();

    vouchers.map((item: any) => {
      console.log(`${process.env.NEXT_PUBLIC_VOUCHER_BASE_URL}/api/v1/redeem`, {
        reservation_id: item.reservation_id,
        order_ref: item.order_ref,
        payment_reference: payment_reference,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        idempotency_key: uuid,
      });
    });

    console.log(body, paramsObject, vouchers);

    if (status === "completed" && payment_id) {
      try {
        const confirmsaleOrder = await OddoAxios.post(
          "/json/2/sale.order/action_confirm",
          { ids: [parseInt(salesOderId)] },
        ).then((res) => res.data);

        console.log("confirmsaleOrder :: ", confirmsaleOrder);

        const reservePromises = vouchers.map((item: any) => {
          return VoucherAxios.post(`/api/v1/redeem`, {
            reservation_id: item.reservation_id,
            order_ref: item.order_ref,
            payment_reference: payment_reference,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            idempotency_key: uuid,
          }).then((res) => res.data);
        });

        const results: any = await Promise.allSettled(reservePromises);

        console.log("redmeeemVoucher :: ", results);

        if (confirmsaleOrder) {
          try {
            const wizard = await OddoAxios.post(
              "/json/2/sale.advance.payment.inv/create",
              {
                vals_list: [
                  {
                    advance_payment_method: "delivered",
                    sale_order_ids: [[6, 0, [parseInt(salesOderId)]]],
                  },
                ],
              },
            ).then((res) => res.data);
            console.log("wizard created successfully:", wizard);
            if (wizard && Array.isArray(wizard) && wizard.length > 0) {
              try {
                const invoice = await OddoAxios.post(
                  "/json/2/sale.advance.payment.inv/create_invoices",
                  { ids: [wizard[0]] },
                ).then((res) => res.data);
                console.log("invoice created successfully:", invoice);
                const { res_id } = invoice;
                if (res_id) {
                  try {
                    const action = await OddoAxios.post(
                      "/json/2/account.move/action_post",
                      { ids: [res_id] },
                    ).then((res) => res.data);
                    console.log("action post successfully:", action);

                    const unreconciled = await OddoAxios.post(
                      "/json/2/account.move.line/search_read",
                      {
                        domain: [
                          ["payment_id", "=", payment_id],
                          [
                            "account_type",
                            "in",
                            ["asset_receivable", "liability_payable"],
                          ],
                          ["reconciled", "=", false],
                        ],
                        fields: ["id", "name", "amount_residual"],
                      },
                    ).then((res) => res.data);
                    console.log("unreconciled lines:", unreconciled);
                    if (
                      unreconciled &&
                      Array.isArray(unreconciled) &&
                      unreconciled.length > 0
                    ) {
                      try {
                        const reconcile = await OddoAxios.post(
                          "/json/2/account.move/js_assign_outstanding_line",
                          {
                            ids: [res_id],
                            line_id: unreconciled[0]?.id,
                          },
                        ).then((res) => res.data);

                        if (reconcile === null) {
                          console.log(
                            "Payment sucess invoice generation completed!",
                          );
                          return NextResponse.json({
                            received: true,
                            reconcile: true,
                          });
                        }
                      } catch (error) {
                        console.error(
                          "Error in fetching reconcile lines:",
                          error,
                        );
                        return NextResponse.json({ reconcile: false });
                      }
                    } else {
                      return NextResponse.json({ unreconciled: false });
                    }
                  } catch (error) {
                    console.error("Error in posting invoice:", error);
                    return NextResponse.json({
                      action: false,
                      unreconciled: false,
                    });
                  }
                }
              } catch (error) {
                console.error("Error in invoice creation:", error);
                return NextResponse.json({ invoice: false });
              }
            }
          } catch (error) {
            console.error("Error in wizard webhook processing:", error);
            return NextResponse.json({ wizard: false });
          }
        }
      } catch (error) {
        console.error("Error in confirmsaleOrder webhook processing:", error);
        return NextResponse.json({ confirmsaleOrder: false });
      }
    }

    return NextResponse.json({ received: false });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ received: false });
  }
}
