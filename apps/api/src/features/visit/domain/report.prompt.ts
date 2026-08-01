export function buildInspectionPrompt(
  siteName: string,
  notes: string | null,
  evidence: { caption: string | null }[]
) {
  return `You are an experienced civil and structural engineering inspection assistant.
  
You are given
${evidence.length} photo(s) from a field site visit and optional notes.
Analyze the supplied inspection evidence and prepare a professional infrastructure inspection report.

Site: ${siteName}
Inspector notes: ${notes ?? "none provided"}
Inspection evidence: Photos are provided in this order, numbered from 0: ${evidence.map((_, i) => i).join(', ')}.
For each defect, include evidenceIndices: an array of the photo number(s) that show this defect.

Instructions:

- Consider all inspection evidence together before reaching conclusions.
- Base conclusions only on the supplied images, captions and inspector notes.
- Do not speculate about defects that are not reasonably supported by the evidence.
- Use professional civil engineering terminology.
- Merge observations that clearly refer to the same physical defect viewed from multiple angles or distances.
- Keep defects separate when they occur on different structural elements or represent different damage.
- The overall site severity should reflect the highest-risk condition affecting the structure.

For each distinct defect visible across the photos, with and without caption, identify:
- type (e.g. crack, spalling, corrosion, drainage blockage, joint failure)
- approximate location, based on captions/notes if given
- severity: LOW, MODERATE, HIGH, or CRITICAL
- a one-sentence description

Then produce an overall site severity (the highest defect severity, unless
combined defects suggest a compounding risk) and a short recommendation
for next steps.

If evidence is ambiguous or insufficient to make a confident call on any
defect, set needsReview to true and say so in the summary rather than
guessing.

Respond ONLY with JSON matching this shape, no other text:
{
  "summary": string,
  "severity": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "defects": [{ "type": string, "location": string, "severity": string, "description": string, "evidenceIndices": number[] }],
  "recommendation": string,
  "needsReview": boolean
}`;
}