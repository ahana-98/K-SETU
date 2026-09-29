# SIH Demo Guide

## Purpose

This guide walks through the K-SETU prototype's end-to-end e-waste transaction flow, from collector lot creation to recycler handover, payment, traceability, and admin analytics.

> **Demo note:** Use the seeded synthetic data and demo accounts. Prices, profiles, and transactions shown during the presentation are illustrative, not live market data.

## Demo Workflow

### 1. Sign in as a Collector

1. Open the K-SETU application.
2. Select **Continue as Collector** on the login screen.
3. Confirm that the collector dashboard loads.

### 2. Create an E-Waste Lot

1. Open **Sell E-Waste**.
2. Add a photo of the e-waste item.
3. Select **PCB** as the material.
4. Enter a weight of **8 kg**.
5. Run the material classification and estimate workflow.
6. Show the illustrative estimate of approximately **₹1,440**, if the configured demo data produces that value.
7. Create the lot and confirm that it appears in the collector's lots.

### 3. Demonstrate Prices and Accessibility

1. Open the price board.
2. Show the current material prices and price-history view.
3. Use the **Listen** control to demonstrate text-to-speech, if available.
4. Highlight the multilingual and accessibility-oriented interface.

### 4. Find a Recycler and Request a Quote

1. Open the recycler discovery or matching view.
2. Find a suitable recycler for the newly created lot.
3. Open the lot's quote-request action.
4. Submit the request and show the resulting status.

### 5. Sign in as a Recycler

1. Log out of the collector account.
2. Select **Continue as Recycler**.
3. Open the incoming-lots view.
4. Locate the newly submitted lot.
5. Review its material, weight, and available details.
6. Submit a quote for the lot.

### 6. Complete the Handover

1. Open the recycler's **Handover** tab.
2. Select the relevant transaction or handover.
3. Follow the available workflow:

   * **Confirm Pickup**
   * **Confirm Handover**
   * **Mark Paid**
4. Show the updated handover and payment status.

The exact available actions depend on the application's current transaction state.

### 7. Verify the Collector's Receipt and Traceability

1. Log out of the recycler account.
2. Sign in again as the collector.
3. Open **My Lots**.
4. Open the completed lot.
5. Show the receipt, QR code, and traceability information, where available.
6. Confirm that the collector's earnings reflect the completed transaction.

If quote acceptance is a separate step in the current build, complete it before proceeding with the handover.

### 8. Demonstrate the Admin Dashboard

1. Log out of the collector account.
2. Select **Continue as Admin**.
3. Open the admin dashboard.
4. Show the dashboard statistics and analytics.
5. Verify that the completed transaction is reflected in the relevant views.

### 9. Optional: Reset Demo Data

If you need to repeat the demonstration:

1. Open the admin **System** section.
2. Use the demo reset action only if it is enabled and appropriate for the environment.
3. Confirm that the application is ready for another demo run.

**Important:** Demo reset may remove or recreate sample data. Do not use it against a production database or any database containing records that must be preserved. If demo reset is disabled by configuration, the reset request should be rejected.

## Presentation Tips

* Explain the collector-to-recycler journey before starting the live workflow.
* Use the same lot throughout the collector, recycler, and admin demonstrations.
* Point out that the estimate is illustrative and may vary with configured demo data.
* Emphasize that the prototype connects lot creation, recycler quotes, handover, payment status, and traceability in one workflow.
* Clearly identify synthetic records and prototype ML outputs as demonstrations rather than verified real-world results.
* Keep the workflow moving by preparing the demo accounts and checking that the database is seeded before presenting.

## Troubleshooting

* **Demo login unavailable:** Check the application's demo-auth configuration and confirm that demo access is enabled.
* **No incoming lot appears:** Confirm that the collector created the lot and successfully requested a quote.
* **Recycler cannot submit a quote:** Check the lot status, recycler session, and role permissions.
* **Handover actions are unavailable:** Verify that the quote and transaction have reached the required state.
* **Dashboard figures do not update:** Refresh the view and confirm that the transaction was successfully completed.
* **Reset is rejected:** Check whether the demo reset feature is disabled in the environment configuration.

## Related Documentation

* [README](../README.md)
* [Architecture](./ARCHITECTURE.md)
* [API Reference](./API.md)
* [Database](./DATABASE.md)
* [Dataset](./DATASET.md)
* [Offline Support](./OFFLINE.md)