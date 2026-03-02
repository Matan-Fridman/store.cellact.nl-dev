const { v4: uuidv4 } = require('uuid');
/**
 * Standalone notification service for Arnacon.
 * Not part of the core SDK — import directly if needed:
 *   const NotificationService = require('arnacon-sdk/utils/NotificationService');
 */
class NotificationService {
    constructor(endpoint = "https://europe-west1-arnacon-production-gcp.cloudfunctions.net/notification-center") {
        this.endpoint = endpoint;
    }

    /**
     * Send a new-item notification via the GCP Cloud Function
     * @param {Object} params
     * @param {string} params.callee - The recipient of the notification
     * @param {string} params.domain - The domain of the callee
     * @param {string} params.fcm_token - Firebase Cloud Messaging token
     * @param {string} params.uuid_to_sign - UUID to sign
     * @param {string} [params.package_type] - Package type (e.g. "ENS", "EMAIL", "SOCIAL")
     * @param {string} [params.label] - Optional label
     */
    /**
     * Send a new-item notification via the GCP Cloud Function
     * @param {Object} params
     * @param {string} params.walletAddress - The address of the user (maps to user_address)
     * @param {string} params.uuid_to_sign - UUID to sign (used for both uuid_to_sign and customer_id)
     * @param {string} params.selectedName - The selected name (maps to selected_name)
     * @param {string} [params.PACKAGE_TYPES] - Object containing package type constants
     */
    async send({ walletAddress, selectedName, package_type }) {
        if (!walletAddress) throw new Error("walletAddress is required");
        if (!selectedName) throw new Error("selectedName is required");
        if (!package_type) throw new Error("package_type is required");
        const uuid_to_sign = uuidv4();

        const body = {
            user_address: walletAddress,
            item: "BATMAN",
            package_type: package_type,
            uuid_to_sign: uuid_to_sign,
            callee: selectedName,
            domain: "paris1.cellact.nl"
        };

        const response = await fetch(this.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Notification failed (${response.status}): ${text}`);
        }
        console.log("✅ Notification sent:", response);
        const data = await response.json();
        console.log("✅ Notification sent:", data);
        return data;
    }
}

module.exports = NotificationService;
