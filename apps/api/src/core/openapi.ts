import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Inspection AI API",
      version: "1.0.0",
      description:
        "API for managing bridge / infrastructure inspections. Collect evidence (photos, audio) and generate AI-powered defect reports.",
    },
    servers: [
      {
        url: "http://localhost:8000/v1",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        VisitDTO: {
          type: "object",
          required: ["id", "siteName", "inspectorName", "notes", "status", "evidence", "report"],
          properties: {
            id: { type: "string", description: "CUID of the visit" },
            siteName: { type: "string", example: "Brooklyn Bridge" },
            inspectorName: { type: "string", example: "Jane Doe" },
            notes: { type: "string", nullable: true, example: "Check the south abutment" },
            status: { type: "string", enum: ["OPEN", "GENERATING", "COMPLETE"] },
            evidence: {
              type: "array",
              items: { $ref: "#/components/schemas/EvidenceDTO" },
            },
            report: {
              oneOf: [
                { $ref: "#/components/schemas/ReportDTO" },
                { type: "null" },
              ],
            },
          },
        },
        CreateVisitInput: {
          type: "object",
          required: ["siteName", "inspectorName"],
          properties: {
            siteName: { type: "string", example: "Brooklyn Bridge" },
            inspectorName: { type: "string", example: "Jane Doe" },
            notes: { type: "string", example: "Focus on the cable saddles" },
          },
        },
        EvidenceDTO: {
          type: "object",
          required: ["id", "imageUrl", "caption", "audioUrl", "captionSource"],
          properties: {
            id: { type: "string" },
            imageUrl: { type: "string", format: "uri", example: "/uploads/abc123.jpg" },
            caption: { type: "string", nullable: true, example: "Crack detected on the underside" },
            audioUrl: { type: "string", nullable: true, example: "/uploads/def456.wav" },
            captionSource: { type: "string", enum: ["TEXT", "VOICE"], nullable: true },
          },
        },
        AddEvidenceInput: {
          type: "object",
          required: ["imageUrl"],
          properties: {
            imageUrl: { type: "string", format: "uri" },
            caption: { type: "string" },
            audioUrl: { type: "string", format: "uri" },
            captionSource: { type: "string", enum: ["TEXT", "VOICE"] },
          },
        },
        ReportDTO: {
          type: "object",
          required: ["summary", "severity", "defects", "recommendation", "needsReview"],
          properties: {
            summary: { type: "string", example: "Moderate corrosion found on the main girders." },
            severity: { type: "string", enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"] },
            defects: {
              type: "array",
              items: { $ref: "#/components/schemas/DefectData" },
            },
            recommendation: { type: "string", example: "Schedule a detailed inspection within 30 days." },
            needsReview: { type: "boolean" },
          },
        },
        DefectData: {
          type: "object",
          required: ["type", "location", "severity", "description", "evidenceIds"],
          properties: {
            type: { type: "string", example: "crack" },
            location: { type: "string", example: "underside of deck, mid-span" },
            severity: { type: "string", enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"] },
            description: { type: "string", example: "Hairline crack ~15 cm long" },
            evidenceIds: { type: "array", items: { type: "string" } },
          },
        },
        ApiError: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: { type: "string", example: "NOT_FOUND" },
            message: { type: "string", example: "Visit not found" },
            data: { type: "object" },
          },
        },
      },
    },
  },
  apis: ["./src/features/**/route.ts"],
};

export const openApiSpec = swaggerJsdoc(options);