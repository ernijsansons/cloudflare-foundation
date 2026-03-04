import { Agent } from "agents";

// We keep a rolling memory log of customer inquiries for context
export type TriageState = {
  inquiries: Array<{
    id: string;
    from: string;
    subject: string;
    body: string;
    timestamp: number;
    intent?: "bug" | "feature_request" | "support" | "billing" | "spam" | "unknown";
    status: "new" | "triaged" | "resolved";
    summary?: string;
    escalatedTo?: string; // e.g. "engineering", "billing_dept"
  }>;
};

export interface Env {
  // We specify only the bindings we strictly need
  DB: D1Database;
  AI: Ai;
}

export class SupportAgent extends Agent<Env, TriageState> {
  initialState: TriageState = { inquiries: [] };

  async onStart(): Promise<void> {
    // Optional setup when the DO wakes up
  }

  // An HTTP endpoint for the email worker to hit when a new email arrives
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 1. Submit a new email for triage
    if (url.pathname === "/submit" && request.method === "POST") {
      try {
        const data = await request.json() as {
          from: string;
          subject: string;
          body: string;
        };

        if (!data.from || !data.body) {
          return Response.json({ error: "from and body are required" }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const newInquiry = {
          id,
          from: data.from,
          subject: data.subject || "No Subject",
          body: data.body,
          timestamp: Date.now(),
          status: "new" as const,
        };

        // Add to state
        await this.setState({
          inquiries: [...this.state.inquiries, newInquiry]
        });

        // Trigger triage asynchronously
        this.ctx.waitUntil(this.triageInquiry(id));

        return Response.json({ success: true, id, status: "Submitted for triage" });
      } catch (err) {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    // 2. View current state / active queue
    if (url.pathname === "/queue" && request.method === "GET") {
      return Response.json({ inquiries: this.state.inquiries });
    }

    return new Response("Support/Triage Agent Endpoint", { status: 200 });
  }

  // Triage logic using AI
  async triageInquiry(id: string): Promise<void> {
    const inquiryIndex = this.state.inquiries.findIndex((i) => i.id === id);
    if (inquiryIndex === -1) return;

    const inquiry = this.state.inquiries[inquiryIndex];
    if (inquiry.status !== "new") return;

    const prompt = `
    Analyze the following customer email and determine its intent.
    Output ONLY a valid JSON object with the following structure:
    {
      "intent": "bug" | "feature_request" | "support" | "billing" | "spam" | "unknown",
      "summary": "A concise 1-sentence summary of the user's issue",
      "escalatedTo": "engineering" | "billing_dept" | "customer_success" | null
    }

    Email From: ${inquiry.from}
    Email Subject: ${inquiry.subject}
    Email Body:
    ${inquiry.body}
    `;

    try {
      const response = await this.retry(
        () =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.env.AI.run("@cf/meta/llama-3.1-8b-instruct" as any, {
            messages: [{ role: "user", content: prompt }],
          }),
        { maxAttempts: 3 }
      );

      const assistantContent = (response as { response?: string }).response || "{}";

      // Parse JSON
      const startIdx = assistantContent.indexOf("{");
      const endIdx = assistantContent.lastIndexOf("}");
      let result = { intent: "unknown", summary: "Failed to parse", escalatedTo: null };

      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = assistantContent.substring(startIdx, endIdx + 1);
        try {
          result = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Failed to parse triage result:", e);
        }
      }

      // Update state
      const updatedInquiries = [...this.state.inquiries];
      updatedInquiries[inquiryIndex] = {
        ...inquiry,
        status: "triaged",
        intent: result.intent as any,
        summary: result.summary,
        escalatedTo: result.escalatedTo as any,
      };

      await this.setState({ inquiries: updatedInquiries });

      // TODO: Here we could insert the triaged result into a D1 table or a Queue
      // if we wanted to persist it outside the DO.
      
    } catch (error) {
       console.error("Triage failed for inquiry " + id, error);
    }
  }

  validateStateChange(state: TriageState): void {
    // Keep last 500 inquiries to prevent state explosion in SQLite
    if (state.inquiries.length > 500) {
      state.inquiries = state.inquiries.slice(-500);
    }
  }
}
