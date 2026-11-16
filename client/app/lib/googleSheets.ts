import { google } from "googleapis";

export async function appendProductToSheet(productData: {
    name: string;
    price: string | number;
    stock: string | number;
    category?: string;
}) {
    try {
        // Parseamos el JSON completo de la cuenta de servicio desde la variable de entorno
        const serviceAccountCreds = JSON.parse(
            process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}"
        );

        if (!serviceAccountCreds.client_email) {
            throw new Error("Faltan las credenciales de Google Service Account en el archivo .env.local");
        }

        // Usamos el auth object constructor recomendado por Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: serviceAccountCreds.client_email,
                private_key: serviceAccountCreds.private_key?.replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const values = [
            [
                productData.name,
                productData.price,
                productData.stock,
                productData.category || "General",
                new Date().toLocaleString(),
            ],
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Hoja 1!A:E",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values,
            },
        });

        console.log("Producto sincronizado con Google Sheets exitosamente.");
    } catch (error) {
        console.error("Error al sincronizar con Google Sheets:", error);
    }
}