"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "en" | "hi" | "mr";

export const LANGS: {
  code: Lang;
  label: string;
  speech: string;
}[] = [
  { code: "en", label: "English", speech: "en-IN" },
  { code: "hi", label: "हिन्दी", speech: "hi-IN" },
  { code: "mr", label: "मराठी", speech: "mr-IN" },
];

const en: Record<string, string> = {
  "app.tagline": "COLLECT • CONNECT • RECYCLE",
  "app.desc":
    "K-SETU connects informal e-waste collectors with authorized recyclers for fair prices, safe handling and traceable recycling.",

  "login.title": "Sign in to K-SETU",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "LOGIN",
  "login.demo": "DEMO LOGIN",
  "login.demoOnly": "DEMO ONLY",
  "login.asCollector": "Continue as Collector",
  "login.asRecycler": "Continue as Recycler",
  "login.asAdmin": "Continue as Admin",
  "login.error": "Invalid email or password.",
  "login.serverDown":
    "Server unavailable. Local Demo Mode is available.",
  "login.demoMode":
    "LOCAL DEMO MODE — database unavailable, using built-in demo accounts. Not for production.",
  "login.language": "Language",

  "nav.home": "Home",
  "nav.sell": "Sell",
  "nav.price": "Price",
  "nav.recycler": "Recycler",
  "nav.earnings": "Earnings",
  "nav.lots": "My Lots",
  "nav.safety": "Safety",
  "nav.profile": "Profile",

  "common.logout": "Logout",
  "common.loading": "Loading…",
  "common.retry": "Retry",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.save": "Save",
  "common.back": "Back",
  "common.next": "Next",
  "common.viewDetails": "View details",
  "common.offline": "Offline — data saved on device",
  "common.online": "Online",
  "common.syncing": "Syncing…",
  "common.synced": "Synced",
  "common.pendingSync": "Pending sync",
  "common.demoData": "DEMO DATA",
  "common.indicative": "INDICATIVE",
  "common.prototype": "PROTOTYPE",
  "common.updated": "Updated",
  "common.today": "Today",
  "common.perKg": "/ kg",
  "common.listen": "Listen",
  "common.close": "Close",
  "common.all": "All",
  "common.noData": "No records yet.",

  "home.greeting": "Namaste",
  "home.totalEarnings": "Total earnings",
  "home.pending": "Pending amount",
  "home.quickActions": "Quick actions",
  "home.sellCta": "SELL E-WASTE",
  "home.priceCta": "CHECK PRICE",
  "home.recyclerCta": "FIND RECYCLER",
  "home.earningsCta": "MY EARNINGS",
  "home.safetyCta": "SAFETY",
  "home.lotsCta": "MY LOTS",
  "home.recentLot": "Recent lot",
  "home.recentTx": "Recent transaction",
  "home.pendingPayment": "Pending payment",
  "home.guidelinesCta": "Guidelines",
  "guidelines.badge": "COLLECTOR GUIDE",
"guidelines.title": "How to Use K-SETU",
"guidelines.description":
  "Follow these steps to collect e-waste, create a lot, connect with a recycler and complete the recycling transaction.",

"guidelines.workflowTitle": "Collector workflow",
"guidelines.workflowDescription":
  "The complete K-SETU journey from collection to recycling.",

"guidelines.workflow.collect": "Collect",
"guidelines.workflow.add": "Add e-waste",
"guidelines.workflow.lot": "Create lot",
"guidelines.workflow.recycler": "Find recycler",
"guidelines.workflow.handover": "Handover",
"guidelines.workflow.verify": "Verify",
"guidelines.workflow.track": "Track",

"guidelines.stepsTitle": "Step-by-step guide",
"guidelines.stepsDescription":
  "Follow each step when using the Collector section of K-SETU.",

"guidelines.step1.title": "Log in to K-SETU",
"guidelines.step1.description":
  "Log in using your Collector account to access your dashboard and collection features.",
"guidelines.step1.action": "Start from the Collector Dashboard",

"guidelines.step2.title": "Add your e-waste",
"guidelines.step2.description":
  "Enter the details of the e-waste you have collected, including its category, quantity and condition.",
"guidelines.step2.action": "Add accurate item information",

"guidelines.step3.title": "Check the Price Board",
"guidelines.step3.description":
  "Use the Price Board to view the indicative buying rates available for different e-waste categories.",
"guidelines.step3.action": "Check current indicative rates",

"guidelines.step4.title": "Create a lot",
"guidelines.step4.description":
  "Create a lot by grouping the collected e-waste and providing the required collection details.",
"guidelines.step4.action": "Submit the lot details",

"guidelines.step5.title": "Find a suitable recycler",
"guidelines.step5.description":
  "K-SETU helps you discover suitable authorized recyclers based on the collected material and service area.",
"guidelines.step5.action": "Review available recyclers",

"guidelines.step6.title": "Review recycler options",
"guidelines.step6.description":
  "Compare the available recycler information, matching details and offered price before making your selection.",
"guidelines.step6.action": "Review the available options",

"guidelines.step7.title": "Select a recycler",
"guidelines.step7.description":
  "Choose a suitable recycler for your lot and proceed with the transaction.",
"guidelines.step7.action": "Accept the recycler",

"guidelines.step8.title": "Arrange pickup or handover",
"guidelines.step8.description":
  "Follow the pickup or handover information provided through K-SETU and prepare the lot for transfer.",
"guidelines.step8.action": "Complete the handover",

"guidelines.step9.title": "Verify with QR",
"guidelines.step9.description":
  "Use the K-SETU QR verification process when required to confirm the transaction or handover.",
"guidelines.step9.action": "Verify the transaction",

"guidelines.step10.title": "Track your transaction",
"guidelines.step10.description":
  "Use your Collector dashboard to check the status and traceability information of your transaction.",
"guidelines.step10.action": "Track transaction status",

"guidelines.step11.title": "Complete the recycling process",
"guidelines.step11.description":
  "After successful handover and payment confirmation, the lot continues through the recycling workflow.",
"guidelines.step11.action": "Keep your transaction record",

"guidelines.rememberTitle": "Important things to remember",
"guidelines.remember1":
  "Enter correct information when creating a lot.",
"guidelines.remember2":
  "Review recycler details before accepting a recycler.",
"guidelines.remember3":
  "Follow the pickup or handover information shown in the application.",
"guidelines.remember4":
  "Complete QR verification when it is required for the transaction.",
"guidelines.remember5":
  "Keep your transaction information for future reference.",

"guidelines.readyTitle": "Ready to start?",
"guidelines.readyDescription":
  "Go back to your Collector dashboard and begin your workflow.",
"guidelines.dashboardButton": "Go to Collector Dashboard",

  "sell.title": "Sell E-Waste",
  "sell.photo": "Material photo",
  "sell.takePhoto": "Take photo",
  "sell.upload": "Upload",
  "sell.material": "Select material",
  "sell.weight": "Weight (kg)",
  "sell.condition": "Condition",
  "sell.location": "Collection location",
  "sell.useGps": "Use GPS",
  "sell.classify": "Identify material",
  "sell.confidence": "Prototype confidence",
  "sell.alternatives": "Possible alternatives",
  "sell.estimate": "Estimated value",
  "sell.estimateNote":
    "Estimate only — final price is set by the recycler quote.",
  "sell.create": "CREATE LOT",
  "sell.created": "Lot created",
  "sell.cond.good": "Good",
  "sell.cond.used": "Used",
  "sell.cond.damaged": "Damaged",
  "sell.cond.mixed": "Mixed",
  "sell.cond.unknown": "Unknown",

  "price.title": "Price Board",
  "price.marketRange": "Market range",
  "price.rate": "Current indicative rate",
  "price.trend": "Trend",
  "price.up": "Increasing",
  "price.down": "Decreasing",
  "price.stable": "Stable",
  "price.history": "Price history",
  "price.speak":
    "{category} price is approximately {rate} rupees per kilogram.",

  "rec.title": "Find Recycler",
  "rec.verified": "VERIFIED",
  "rec.sample": "SAMPLE RECYCLER",
  "rec.rate": "Offered rate",
  "rec.pickup": "Pickup available",
  "rec.noPickup": "Drop-off only",
  "rec.requestQuote": "REQUEST QUOTE",
  "rec.material": "Material for matching",
  "rec.matchScore": "Match",

  "earn.title": "Earnings",
  "earn.paid": "Paid",
  "earn.pending": "Pending",
  "earn.completed": "Completed transactions",
  "earn.ledger": "Earnings ledger",
  "earn.chart": "Monthly earnings",

  "status.open": "Open",
  "status.quoted": "Quoted",
  "status.accepted": "Accepted",
  "status.handover": "Handover",
  "status.completed": "Completed",
  "status.cancelled": "Cancelled",
  "status.paid": "PAID",
  "status.pending": "PENDING",

  "lot.quotes": "Quotes received",
  "lot.accept": "Accept",
  "lot.reject": "Reject",
  "lot.noQuotes":
    "No quotes yet. Recyclers will respond soon.",
  "lot.requested": "Quote requested",

  "handover.ref": "Handover reference",
  "handover.receipt": "Digital receipt",
  "handover.trace": "Traceability",
  "handover.qr": "Verification QR",
  "handover.payment": "Payment",

  "trace.collected": "Collected",
  "trace.lot": "Lot created",
  "trace.quote": "Quote received",
  "trace.selected": "Recycler selected",
  "trace.handover": "Handover",
  "trace.confirmed": "Recycler confirmed",
  "trace.payment": "Payment",
  "trace.recycling": "Recycling",

  "safety.title": "Safety Guide",

  "profile.title": "Profile",
  "profile.language": "Interface language",
  "profile.sync": "Device sync",
  "profile.about": "About this prototype",

  "recy.dashboard": "Dashboard",
  "recy.incoming": "Incoming Lots",
  "recy.quotes": "Quotes",
  "recy.handovers": "Handover",
  "recy.transactions": "Transactions",
  "recy.submitQuote": "SUBMIT QUOTE",
  "recy.rate": "Your rate (₹/kg)",
  "recy.notes": "Notes",
  "recy.confirmPickup": "CONFIRM PICKUP",
  "recy.confirmHandover": "CONFIRM HANDOVER",
  "recy.markPaid": "MARK PAID",
  "recy.paymentMethod": "Payment method",

  "admin.dashboard": "Dashboard",
  "admin.analytics": "Analytics",
  "admin.records": "Records",
  "admin.insights": "Insights",
  "admin.system": "System",

  "verify.title": "K-SETU VERIFIED HANDOVER",
  "verify.notFound": "Handover reference not found.",
  "unauthorized": "You don't have permission to access this page.",
};

const hi: Record<string, string> = {
  "app.tagline": "संग्रह • जुड़ाव • पुनर्चक्रिकरण",
  "app.desc":
    "K-SETU कबाड़ी और इलेक्ट्रॉनिक कचरा बीनने वालों को अधिकृत रीसाइक्लरों से जोड़ता है — सही दाम, सुरक्षित प्रक्रिया और पारदर्शी रीसाइक्लिंग।",

  "login.title": "K-SETU में साइन इन करें",
  "login.email": "ईमेल",
  "login.password": "पासवर्ड",
  "login.submit": "लॉगिन",
  "login.demo": "डेमो लॉगिन",
  "login.demoOnly": "केवल डेमो",
  "login.asCollector": "कलेक्टर के रूप में जारी रखें",
  "login.asRecycler": "रीसाइक्लर के रूप में जारी रखें",
  "login.asAdmin": "एडमिन के रूप में जारी रखें",
  "login.error": "गलत ईमेल या पासवर्ड।",
  "login.serverDown":
    "सर्वर उपलब्ध नहीं। लोकल डेमो मोड उपलब्ध है।",
  "login.demoMode":
    "लोकल डेमो मोड — डेटाबेस उपलब्ध नहीं, अंतर्निहित डेमो खाते उपयोग में।",
  "login.language": "भाषा",

  "nav.home": "होम",
  "nav.sell": "बेचें",
  "nav.price": "भाव",
  "nav.recycler": "रीसाइक्लर",
  "nav.earnings": "कमाई",
  "nav.lots": "मेरे लॉट",
  "nav.safety": "सुरक्षा",
  "nav.profile": "प्रोफ़ाइल",

  "common.logout": "लॉगआउट",
  "common.loading": "लोड हो रहा है…",
  "common.retry": "पुनः प्रयास",
  "common.cancel": "रद्द करें",
  "common.confirm": "पुष्टि करें",
  "common.save": "सहेजें",
  "common.back": "वापस",
  "common.next": "आगे",
  "common.viewDetails": "विवरण देखें",
  "common.offline": "ऑफ़लाइन — डेटा फ़ोन में सहेजा गया",
  "common.online": "ऑनलाइन",
  "common.syncing": "सिंक हो रहा है…",
  "common.synced": "सिंक हुआ",
  "common.pendingSync": "सिंक बाकी",
  "common.demoData": "डेमो डेटा",
  "common.indicative": "अनुमानित",
  "common.prototype": "प्रोटोटाइप",
  "common.updated": "अद्यतन",
  "common.today": "आज",
  "common.perKg": "/ किलो",
  "common.listen": "सुनें",
  "common.close": "बंद करें",
  "common.all": "सभी",
  "common.noData": "अभी कोई रिकॉर्ड नहीं।",

  "home.greeting": "नमस्ते",
  "home.totalEarnings": "कुल कमाई",
  "home.pending": "बाकी राशि",
  "home.quickActions": "त्वरित कार्य",
  "home.sellCta": "ई-कचरा बेचें",
  "home.priceCta": "भाव देखें",
  "home.recyclerCta": "रीसाइक्लर खोजें",
  "home.earningsCta": "मेरी कमाई",
  "home.safetyCta": "सुरक्षा",
  "home.guidelinesCta": "दिशानिर्देश",
  "guidelines.badge": "कलेक्टर गाइड",
"guidelines.title": "K-SETU का उपयोग कैसे करें",
"guidelines.description":
  "ई-कचरा एकत्र करने, लॉट बनाने, रीसाइक्लर से जुड़ने और रीसाइक्लिंग लेनदेन पूरा करने के लिए इन चरणों का पालन करें।",

"guidelines.workflowTitle": "कलेक्टर प्रक्रिया",
"guidelines.workflowDescription":
  "कलेक्शन से रीसाइक्लिंग तक K-SETU की पूरी प्रक्रिया।",

"guidelines.workflow.collect": "कलेक्ट करें",
"guidelines.workflow.add": "ई-कचरा जोड़ें",
"guidelines.workflow.lot": "लॉट बनाएं",
"guidelines.workflow.recycler": "रीसाइक्लर खोजें",
"guidelines.workflow.handover": "हैंडओवर",
"guidelines.workflow.verify": "सत्यापित करें",
"guidelines.workflow.track": "ट्रैक करें",

"guidelines.stepsTitle": "चरण-दर-चरण गाइड",
"guidelines.stepsDescription":
  "K-SETU के कलेक्टर सेक्शन का उपयोग करते समय प्रत्येक चरण का पालन करें।",

"guidelines.step1.title": "K-SETU में लॉग इन करें",
"guidelines.step1.description":
  "अपने कलेक्टर अकाउंट से लॉग इन करके डैशबोर्ड और कलेक्शन सुविधाओं तक पहुंचें।",
"guidelines.step1.action": "कलेक्टर डैशबोर्ड से शुरू करें",

"guidelines.step2.title": "अपना ई-कचरा जोड़ें",
"guidelines.step2.description":
  "एकत्र किए गए ई-कचरे की श्रेणी, मात्रा और स्थिति सहित आवश्यक जानकारी दर्ज करें।",
"guidelines.step2.action": "सही वस्तु की जानकारी जोड़ें",

"guidelines.step3.title": "प्राइस बोर्ड देखें",
"guidelines.step3.description":
  "अलग-अलग ई-कचरा श्रेणियों के लिए उपलब्ध अनुमानित खरीद दरें देखने के लिए प्राइस बोर्ड का उपयोग करें।",
"guidelines.step3.action": "वर्तमान अनुमानित दरें देखें",

"guidelines.step4.title": "लॉट बनाएं",
"guidelines.step4.description":
  "एकत्र किए गए ई-कचरे को समूहित करके आवश्यक कलेक्शन जानकारी के साथ लॉट बनाएं।",
"guidelines.step4.action": "लॉट की जानकारी जमा करें",

"guidelines.step5.title": "उपयुक्त रीसाइक्लर खोजें",
"guidelines.step5.description":
  "K-SETU एकत्र किए गए सामग्री और सेवा क्षेत्र के आधार पर उपयुक्त अधिकृत रीसाइक्लर खोजने में मदद करता है।",
"guidelines.step5.action": "उपलब्ध रीसाइक्लर देखें",

"guidelines.step6.title": "रीसाइक्लर विकल्प देखें",
"guidelines.step6.description":
  "चयन करने से पहले उपलब्ध रीसाइक्लर की जानकारी, मैचिंग विवरण और प्रस्तावित कीमत की तुलना करें।",
"guidelines.step6.action": "उपलब्ध विकल्पों की समीक्षा करें",

"guidelines.step7.title": "रीसाइक्लर चुनें",
"guidelines.step7.description":
  "अपने लॉट के लिए उपयुक्त रीसाइक्लर चुनें और लेनदेन आगे बढ़ाएं।",
"guidelines.step7.action": "रीसाइक्लर स्वीकार करें",

"guidelines.step8.title": "पिकअप या हैंडओवर की व्यवस्था करें",
"guidelines.step8.description":
  "K-SETU में दी गई पिकअप या हैंडओवर जानकारी का पालन करें और लॉट को ट्रांसफर के लिए तैयार करें।",
"guidelines.step8.action": "हैंडओवर पूरा करें",

"guidelines.step9.title": "QR से सत्यापित करें",
"guidelines.step9.description":
  "लेनदेन या हैंडओवर की पुष्टि करने के लिए आवश्यक होने पर K-SETU की QR सत्यापन प्रक्रिया का उपयोग करें।",
"guidelines.step9.action": "लेनदेन सत्यापित करें",

"guidelines.step10.title": "अपना लेनदेन ट्रैक करें",
"guidelines.step10.description":
  "लेनदेन की स्थिति और ट्रेसबिलिटी जानकारी देखने के लिए अपने कलेक्टर डैशबोर्ड का उपयोग करें।",
"guidelines.step10.action": "लेनदेन की स्थिति ट्रैक करें",

"guidelines.step11.title": "रीसाइक्लिंग प्रक्रिया पूरी करें",
"guidelines.step11.description":
  "सफल हैंडओवर और भुगतान की पुष्टि के बाद, लॉट रीसाइक्लिंग प्रक्रिया में आगे बढ़ता है।",
"guidelines.step11.action": "लेनदेन का रिकॉर्ड रखें",

"guidelines.rememberTitle": "याद रखने योग्य महत्वपूर्ण बातें",
"guidelines.remember1":
  "लॉट बनाते समय सही जानकारी दर्ज करें।",
"guidelines.remember2":
  "रीसाइक्लर स्वीकार करने से पहले उसकी जानकारी की समीक्षा करें।",
"guidelines.remember3":
  "ऐप में दिखाई गई पिकअप या हैंडओवर जानकारी का पालन करें।",
"guidelines.remember4":
  "लेनदेन के लिए आवश्यक होने पर QR सत्यापन पूरा करें।",
"guidelines.remember5":
  "भविष्य के संदर्भ के लिए अपने लेनदेन की जानकारी सुरक्षित रखें।",

"guidelines.readyTitle": "शुरू करने के लिए तैयार हैं?",
"guidelines.readyDescription":
  "अपने कलेक्टर डैशबोर्ड पर वापस जाएं और अपनी प्रक्रिया शुरू करें।",
"guidelines.dashboardButton": "कलेक्टर डैशबोर्ड पर जाएं",
  "home.lotsCta": "मेरे लॉट",
  "home.recentLot": "हाल का लॉट",
  "home.recentTx": "हाल का लेन-देन",
  "home.pendingPayment": "बाकी भुगतान",

  "sell.title": "ई-कचरा बेचें",
  "sell.photo": "सामग्री की फ़ोटो",
  "sell.takePhoto": "फ़ोटो लें",
  "sell.upload": "अपलोड",
  "sell.material": "सामग्री चुनें",
  "sell.weight": "वज़न (किलो)",
  "sell.condition": "स्थिति",
  "sell.location": "संग्रह स्थान",
  "sell.useGps": "GPS उपयोग करें",
  "sell.classify": "सामग्री पहचानें",
  "sell.confidence": "प्रोटोटाइप विश्वसनीयता",
  "sell.alternatives": "संभावित विकल्प",
  "sell.estimate": "अनुमानित मूल्य",
  "sell.estimateNote":
    "केवल अनुमान — अंतिम दाम रीसाइक्लर तय करेगा।",
  "sell.create": "लॉट बनाएं",
  "sell.created": "लॉट बन गया",
  "sell.cond.good": "अच्छी",
  "sell.cond.used": "प्रयुक्त",
  "sell.cond.damaged": "क्षतिग्रस्त",
  "sell.cond.mixed": "मिश्रित",
  "sell.cond.unknown": "अज्ञात",

  "price.title": "भाव बोर्ड",
  "price.marketRange": "बाज़ार भाव सीमा",
  "price.rate": "वर्तमान अनुमानित भाव",
  "price.trend": "रुझान",
  "price.up": "बढ़ रहा",
  "price.down": "घट रहा",
  "price.stable": "स्थिर",
  "price.history": "भाव इतिहास",
  "price.speak":
    "{category} का भाव लगभग {rate} रुपये प्रति किलो है।",

  "rec.title": "रीसाइक्लर खोजें",
  "rec.verified": "सत्यापित",
  "rec.sample": "नमूना रीसाइक्लर",
  "rec.rate": "दिया गया भाव",
  "rec.pickup": "पिकअप उपलब्ध",
  "rec.noPickup": "केवल ड्रॉप",
  "rec.requestQuote": "भाव मांगें",
  "rec.material": "मिलान हेतु सामग्री",
  "rec.matchScore": "मिलान",

  "earn.title": "कमाई",
  "earn.paid": "भुगतान हुआ",
  "earn.pending": "बाकी",
  "earn.completed": "पूर्ण लेन-देन",
  "earn.ledger": "कमाई बही",
  "earn.chart": "मासिक कमाई",

  "status.open": "खुला",
  "status.quoted": "भाव आया",
  "status.accepted": "स्वीकृत",
  "status.handover": "हस्तांतरण",
  "status.completed": "पूर्ण",
  "status.cancelled": "रद्द",
  "status.paid": "भुगतान हुआ",
  "status.pending": "बाकी",

  "lot.quotes": "प्राप्त भाव",
  "lot.accept": "स्वीकारें",
  "lot.reject": "अस्वीकारें",
  "lot.noQuotes":
    "अभी कोई भाव नहीं। रीसाइक्लर जल्द उत्तर देंगे।",
  "lot.requested": "भाव अनुरोध भेजा",

  "handover.ref": "हस्तांतरण संदर्भ",
  "handover.receipt": "डिजिटल रसीद",
  "handover.trace": "ट्रेस कर सकें",
  "handover.qr": "सत्यापन QR",
  "handover.payment": "भुगतान",

  "trace.collected": "संग्रह",
  "trace.lot": "लॉट बना",
  "trace.quote": "भाव प्राप्त",
  "trace.selected": "रीसाइक्लर चयनित",
  "trace.handover": "हस्तांतरण",
  "trace.confirmed": "रीसाइक्लर पुष्टि",
  "trace.payment": "भुगतान",
  "trace.recycling": "पुनर्चक्रिकरण",

  "safety.title": "सुरक्षा मार्गदर्शिका",

  "profile.title": "प्रोफ़ाइल",
  "profile.language": "भाषा",
  "profile.sync": "डिवाइस सिंक",
  "profile.about": "इस प्रोटोटाइप के बारे में",

  "recy.dashboard": "डैशबोर्ड",
  "recy.incoming": "आने वाले लॉट",
  "recy.quotes": "भाव",
  "recy.handovers": "हस्तांतरण",
  "recy.transactions": "लेन-देन",
  "recy.submitQuote": "भाव भेजें",
  "recy.rate": "आपका भाव (₹/किलो)",
  "recy.notes": "टिप्पणी",
  "recy.confirmPickup": "पिकअप पुष्टि",
  "recy.confirmHandover": "हस्तांतरण पुष्टि",
  "recy.markPaid": "भुगतान चिह्नित",
  "recy.paymentMethod": "भुगतान विधि",

  "admin.dashboard": "डैशबोर्ड",
  "admin.analytics": "विश्लेषण",
  "admin.records": "रिकॉर्ड",
  "admin.insights": "अंतर्दृष्टि",
  "admin.system": "सिस्टम",

  "verify.title": "K-SETU सत्यापित हस्तांतरण",
  "verify.notFound": "हस्तांतरण संदर्भ नहीं मिला।",
  "unauthorized": "इस पृष्ठ की अनुमति नहीं है।",
};

const mr: Record<string, string> = {
  "app.tagline": "संग्रह • जोड • पुनर्चक्रिकरण",
  "app.desc":
    "K-SETU रद्दी गोळा करणाऱ्यांना अधिकृत रीसायक्लरशी जोडते — योग्य भाव, सुरक्षित हाताळणी आणि पारदर्शक पुनर्चक्रिकरण।",

  "login.title": "K-SETU मध्ये साइन इन करा",
  "login.email": "ईमेल",
  "login.password": "पासवर्ड",
  "login.submit": "लॉगिन",
  "login.demo": "डेमो लॉगिन",
  "login.demoOnly": "फक्त डेमो",
  "login.asCollector": "कलेक्टर म्हणून सुरू ठेवा",
  "login.asRecycler": "रीसायक्लर म्हणून सुरू ठेवा",
  "login.asAdmin": "अ‍ॅडमिन म्हणून सुरू ठेवा",
  "login.error": "चुकीचा ईमेल किंवा पासवर्ड.",
  "login.serverDown":
    "सर्व्हर उपलब्ध नाही. लोकल डेमो मोड उपलब्ध आहे.",
  "login.demoMode":
    "लोकल डेमो मोड — डेटाबेस उपलब्ध नाही, अंगभूत डेमो खाती वापरात.",
  "login.language": "भाषा",

  "nav.home": "होम",
  "nav.sell": "विका",
  "nav.price": "भाव",
  "nav.recycler": "रीसायक्लर",
  "nav.earnings": "कमाई",
  "nav.lots": "माझे लॉट",
  "nav.safety": "सुरक्षा",
  "nav.profile": "प्रोफाइल",

  "common.logout": "लॉगआउट",
  "common.loading": "लोड होत आहे…",
  "common.retry": "पुन्हा प्रयत्न",
  "common.cancel": "रद्द करा",
  "common.confirm": "निश्चित करा",
  "common.save": "जतन करा",
  "common.back": "मागे",
  "common.next": "पुढे",
  "common.viewDetails": "तपशील पहा",
  "common.offline": "ऑफलाइन — डेटा फोनमध्ये जतन",
  "common.online": "ऑनलाइन",
  "common.syncing": "सिंक होत आहे…",
  "common.synced": "सिंक झाले",
  "common.pendingSync": "सिंक बाकी",
  "common.demoData": "डेमो डेटा",
  "common.indicative": "अंदाजे",
  "common.prototype": "प्रोटोटाइप",
  "common.updated": "अद्यतनित",
  "common.today": "आज",
  "common.perKg": "/ किलो",
  "common.listen": "ऐका",
  "common.close": "बंद करा",
  "common.all": "सर्व",
  "common.noData": "अजून नोंदी नाहीत.",

  "home.greeting": "नमस्कार",
  "home.totalEarnings": "एकूण कमाई",
  "home.pending": "बाकी रक्कम",
  "home.quickActions": "त्वरित कृती",
  "home.sellCta": "ई-कचरा विका",
  "home.priceCta": "भाव पहा",
  "home.recyclerCta": "रीसायक्लर शोधा",
  "home.earningsCta": "माझी कमाई",
  "home.safetyCta": "सुरक्षा",
  "home.guidelinesCta": "मार्गदर्शिका",
  "guidelines.badge": "कलेक्टर मार्गदर्शिका",
"guidelines.title": "K-SETU कसे वापरावे",
"guidelines.description":
  "ई-कचरा गोळा करण्यासाठी, लॉट तयार करण्यासाठी, रीसायक्लरशी जोडण्यासाठी आणि रीसायक्लिंग व्यवहार पूर्ण करण्यासाठी या चरणांचे पालन करा.",

"guidelines.workflowTitle": "कलेक्टर प्रक्रिया",
"guidelines.workflowDescription":
  "कलेक्शनपासून रीसायक्लिंगपर्यंत K-SETU ची संपूर्ण प्रक्रिया.",

"guidelines.workflow.collect": "गोळा करा",
"guidelines.workflow.add": "ई-कचरा जोडा",
"guidelines.workflow.lot": "लॉट तयार करा",
"guidelines.workflow.recycler": "रीसायक्लर शोधा",
"guidelines.workflow.handover": "हँडओव्हर",
"guidelines.workflow.verify": "पडताळा",
"guidelines.workflow.track": "ट्रॅक करा",

"guidelines.stepsTitle": "चरण-दर-चरण मार्गदर्शिका",
"guidelines.stepsDescription":
  "K-SETU च्या कलेक्टर विभागाचा वापर करताना प्रत्येक चरणाचे पालन करा.",

"guidelines.step1.title": "K-SETU मध्ये लॉग इन करा",
"guidelines.step1.description":
  "तुमच्या कलेक्टर खात्याने लॉग इन करून डॅशबोर्ड आणि कलेक्शन सुविधांमध्ये प्रवेश करा.",
"guidelines.step1.action": "कलेक्टर डॅशबोर्डपासून सुरुवात करा",

"guidelines.step2.title": "तुमचा ई-कचरा जोडा",
"guidelines.step2.description":
  "तुम्ही गोळा केलेल्या ई-कचऱ्याची श्रेणी, प्रमाण आणि स्थिती यासह आवश्यक माहिती भरा.",
"guidelines.step2.action": "अचूक वस्तूची माहिती जोडा",

"guidelines.step3.title": "भाव बोर्ड तपासा",
"guidelines.step3.description":
  "वेगवेगळ्या ई-कचरा श्रेणींसाठी उपलब्ध अंदाजे खरेदी दर पाहण्यासाठी भाव बोर्ड वापरा.",
"guidelines.step3.action": "सध्याचे अंदाजे दर तपासा",

"guidelines.step4.title": "लॉट तयार करा",
"guidelines.step4.description":
  "गोळा केलेला ई-कचरा एकत्र करून आवश्यक कलेक्शन माहितीसह लॉट तयार करा.",
"guidelines.step4.action": "लॉटची माहिती सबमिट करा",

"guidelines.step5.title": "योग्य रीसायक्लर शोधा",
"guidelines.step5.description":
  "K-SETU गोळा केलेल्या सामग्री आणि सेवा क्षेत्राच्या आधारावर योग्य अधिकृत रीसायक्लर शोधण्यास मदत करते.",
"guidelines.step5.action": "उपलब्ध रीसायक्लर पहा",

"guidelines.step6.title": "रीसायक्लरचे पर्याय तपासा",
"guidelines.step6.description":
  "निवड करण्यापूर्वी उपलब्ध रीसायक्लरची माहिती, मॅचिंग तपशील आणि दिलेली किंमत तपासा.",
"guidelines.step6.action": "उपलब्ध पर्याय तपासा",

"guidelines.step7.title": "रीसायक्लर निवडा",
"guidelines.step7.description":
  "तुमच्या लॉटसाठी योग्य रीसायक्लर निवडा आणि व्यवहार पुढे सुरू करा.",
"guidelines.step7.action": "रीसायक्लर स्वीकारा",

"guidelines.step8.title": "पिकअप किंवा हँडओव्हरची व्यवस्था करा",
"guidelines.step8.description":
  "K-SETU मध्ये दिलेल्या पिकअप किंवा हँडओव्हरच्या माहितीचे पालन करा आणि लॉट हस्तांतरणासाठी तयार ठेवा.",
"guidelines.step8.action": "हँडओव्हर पूर्ण करा",

"guidelines.step9.title": "QR द्वारे पडताळणी करा",
"guidelines.step9.description":
  "व्यवहार किंवा हँडओव्हरची पुष्टी करण्यासाठी आवश्यक असल्यास K-SETU ची QR पडताळणी प्रक्रिया वापरा.",
"guidelines.step9.action": "व्यवहाराची पडताळणी करा",

"guidelines.step10.title": "तुमचा व्यवहार ट्रॅक करा",
"guidelines.step10.description":
  "तुमच्या व्यवहाराची स्थिती आणि ट्रेसबिलिटी माहिती पाहण्यासाठी कलेक्टर डॅशबोर्ड वापरा.",
"guidelines.step10.action": "व्यवहाराची स्थिती ट्रॅक करा",

"guidelines.step11.title": "रीसायक्लिंग प्रक्रिया पूर्ण करा",
"guidelines.step11.description":
  "यशस्वी हँडओव्हर आणि पेमेंटची पुष्टी झाल्यानंतर लॉट रीसायक्लिंग प्रक्रियेत पुढे जातो.",
"guidelines.step11.action": "व्यवहाराची नोंद जतन करा",

"guidelines.rememberTitle": "लक्षात ठेवण्यासारख्या महत्त्वाच्या गोष्टी",
"guidelines.remember1":
  "लॉट तयार करताना योग्य माहिती भरा.",
"guidelines.remember2":
  "रीसायक्लर स्वीकारण्यापूर्वी त्याची माहिती तपासा.",
"guidelines.remember3":
  "ॲपमध्ये दाखवलेल्या पिकअप किंवा हँडओव्हरच्या माहितीचे पालन करा.",
"guidelines.remember4":
  "व्यवहारासाठी आवश्यक असल्यास QR पडताळणी पूर्ण करा.",
"guidelines.remember5":
  "भविष्यातील संदर्भासाठी तुमच्या व्यवहाराची माहिती जतन करा.",

"guidelines.readyTitle": "सुरुवात करण्यासाठी तयार आहात?",
"guidelines.readyDescription":
  "तुमच्या कलेक्टर डॅशबोर्डवर परत जा आणि तुमची प्रक्रिया सुरू करा.",
"guidelines.dashboardButton": "कलेक्टर डॅशबोर्डवर जा",
  "home.lotsCta": "माझे लॉट",
  "home.recentLot": "अलीकडील लॉट",
  "home.recentTx": "अलीकडील व्यवहार",
  "home.pendingPayment": "बाकी पेमेंट",

  "sell.title": "ई-कचरा विका",
  "sell.photo": "साहित्याचा फोटो",
  "sell.takePhoto": "फोटो काढा",
  "sell.upload": "अपलोड",
  "sell.material": "साहित्य निवडा",
  "sell.weight": "वजन (किलो)",
  "sell.condition": "स्थिती",
  "sell.location": "संग्रह स्थळ",
  "sell.useGps": "GPS वापरा",
  "sell.classify": "साहित्य ओळखा",
  "sell.confidence": "प्रोटोटाइप विश्वासार्हता",
  "sell.alternatives": "शक्य पर्याय",
  "sell.estimate": "अंदाजे मूल्य",
  "sell.estimateNote":
    "फक्त अंदाज — अंतिम भाव रीसायक्लर ठरवेल.",
  "sell.create": "लॉट तयार करा",
  "sell.created": "लॉट तयार झाला",
  "sell.cond.good": "चांगली",
  "sell.cond.used": "वापरलेली",
  "sell.cond.damaged": "बिघडलेली",
  "sell.cond.mixed": "मिश्र",
  "sell.cond.unknown": "अज्ञात",

  "price.title": "भाव बोर्ड",
  "price.marketRange": "बाजार भाव श्रेणी",
  "price.rate": "सध्याचा अंदाजे भाव",
  "price.trend": "कल",
  "price.up": "वाढत आहे",
  "price.down": "घटत आहे",
  "price.stable": "स्थिर",
  "price.history": "भाव इतिहास",

  // Correct Marathi speech text
  "price.speak":
    "{category} चा भाव साधारण {rate} रुपये प्रति किलो आहे.",

  "rec.title": "रीसायक्लर शोधा",
  "rec.verified": "सत्यापित",
  "rec.sample": "नमुना रीसायक्लर",
  "rec.rate": "दिलेला भाव",
  "rec.pickup": "पिकअप उपलब्ध",
  "rec.noPickup": "फक्त ड्रॉप",
  "rec.requestQuote": "भाव मागवा",
  "rec.material": "जुळवणीसाठी साहित्य",
  "rec.matchScore": "जुळवणी",

  "earn.title": "कमाई",
  "earn.paid": "पेमेंट झाले",
  "earn.pending": "बाकी",
  "earn.completed": "पूर्ण व्यवहार",
  "earn.ledger": "कमाई वहि",
  "earn.chart": "मासिक कमाई",

  "status.open": "खुला",
  "status.quoted": "भाव आला",
  "status.accepted": "स्वीकृत",
  "status.handover": "हस्तांतरण",
  "status.completed": "पूर्ण",
  "status.cancelled": "रद्द",
  "status.paid": "पेमेंट झाले",
  "status.pending": "बाकी",

  "lot.quotes": "आलेले भाव",
  "lot.accept": "स्वीकारा",
  "lot.reject": "नाकारा",
  "lot.noQuotes":
    "अजून भाव नाही. रीसायक्लर लवकरच उत्तर देतील.",
  "lot.requested": "भाव विनंती पाठवली",

  "handover.ref": "हस्तांतरण संदर्भ",
  "handover.receipt": "डिजिटल पावती",
  "handover.trace": "ट्रेसेबिलिटी",
  "handover.qr": "सत्यापन QR",
  "handover.payment": "पेमेंट",

  "trace.collected": "संग्रह",
  "trace.lot": "लॉट तयार",
  "trace.quote": "भाव प्राप्त",
  "trace.selected": "रीसायक्लर निवडले",
  "trace.handover": "हस्तांतरण",
  "trace.confirmed": "रीसायक्लर दुजोरा",
  "trace.payment": "पेमेंट",
  "trace.recycling": "पुनर्चक्रिकरण",

  "safety.title": "सुरक्षा मार्गदर्शक",

  "profile.title": "प्रोफाइल",
  "profile.language": "भाषा",
  "profile.sync": "डिव्हाइस सिंक",
  "profile.about": "या प्रोटोटाइपबद्दल",

  "recy.dashboard": "डॅशबोर्ड",
  "recy.incoming": "येणारे लॉट",
  "recy.quotes": "भाव",
  "recy.handovers": "हस्तांतरण",
  "recy.transactions": "व्यवहार",
  "recy.submitQuote": "भाव पाठवा",
  "recy.rate": "तुमचा भाव (₹/किलो)",
  "recy.notes": "टीपा",
  "recy.confirmPickup": "पिकअप दुजोरा",
  "recy.confirmHandover": "हस्तांतरण दुजोरा",
  "recy.markPaid": "पेमेंट झाले चिन्हांकित",
  "recy.paymentMethod": "पेमेंट पद्धत",

  "admin.dashboard": "डॅशबोर्ड",
  "admin.analytics": "विश्लेषण",
  "admin.records": "नोंदी",
  "admin.insights": "अंतर्दृष्टी",
  "admin.system": "सिस्टम",

  "verify.title": "K-SETU सत्यापित हस्तांतरण",
  "verify.notFound": "हस्तांतरण संदर्भ सापडला नाही.",
  "unauthorized": "या पृष्ठाची परवानगी नाही.",
};

const DICTS: Record<Lang, Record<string, string>> = {
  en,
  hi,
  mr,
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (
    key: string,
    vars?: Record<string, string | number>
  ) => string;
};

const LangContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (
      typeof localStorage !== "undefined"
        ? localStorage.getItem("ksetu_lang")
        : null
    ) as Lang | null;

   if (saved && DICTS[saved]) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setLangState(saved);
}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);

    try {
      localStorage.setItem("ksetu_lang", l);
    } catch {}
  }, []);

  const t = useCallback(
    (
      key: string,
      vars?: Record<string, string | number>
    ) => {
      let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;

      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`{${k}}`, String(v));
        }
      }

      return s;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
    }),
    [lang, setLang, t]
  );

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/**
 * Text-to-speech helper.
 *
 * English  -> en-IN
 * Hindi    -> hi-IN
 * Marathi  -> mr-IN
 *
 * The function explicitly searches for a matching voice.
 * If Marathi is selected but no Marathi voice exists,
 * it will NOT silently fall back to English.
 */
export function speak(text: string, lang: Lang) {
  if (typeof window === "undefined") {
    return;
  }

  // Marathi speech is disabled for now.
  if (lang === "mr") {
    return;
  }

  if (!("speechSynthesis" in window)) {
    console.error(
      "Speech synthesis is not supported in this browser."
    );
    return;
  }

  window.speechSynthesis.cancel();

  const voices = window.speechSynthesis.getVoices();

  const targetLang = lang === "hi" ? "hi-IN" : "en-IN";

  // Prefer an actual Hindi voice for Hindi speech.
  const voice =
    lang === "hi"
      ? voices.find(
          (v) =>
            v.lang.toLowerCase() === "hi-in" ||
            v.lang.toLowerCase().startsWith("hi")
        )
      : voices.find(
          (v) =>
            v.lang.toLowerCase() === "en-in"
        ) ||
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith("en")
        );

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = targetLang;
  utterance.rate = 0.9;
  utterance.pitch = 1;

  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}
export function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}