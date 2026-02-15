export const SOLUTION_PROMPTS = [
    {
        label: 'Initial Prompt',
        prompt: `You are a strict university exam evaluator.

Analyze the attached question paper carefully.

Generate TWO solution versions.

CRITICAL PRINCIPLE:
Answer with the MINIMUM COMPLETE CONTENT required to score FULL MARKS.
Do NOT under-answer.
Do NOT over-explain beyond marks justification.
Depth must scale naturally with marks.

MARK-BASED DEPTH RULES:

0.5-1 Mark:
- Definition, formula, value, or direct result.
- Include formula if required.
- No theory unless explicitly asked.

2-4 Marks:
- Core concept + formula + brief reasoning.
- Short logical steps if required.
- No extended derivations unless essential.

5+ Marks:
- Structured solution.
- Concept explanation.
- Step-by-step reasoning if needed.
- Derivation only if required.
- Diagram reference only if useful.

DIAGRAM RULE:
If helpful, insert:
[Figure: Title]
Then 1-2 lines explaining relevance.
No ASCII drawings.

OUTPUT RULES (VERY STRICT):

1. WRAP the entire JSON in a markdown code block (\`\`\`json ... \`\`\`) for easy copying.
2. Return ONLY valid JSON inside the block.
3. No text before or after the code block.
4. No markdown outside JSON strings (the JSON strings themselves contain escaped markdown).
5. Use double quotes only.
6. Escape all newlines as \\n.
7. Do not use special Unicode symbols (no prime symbol, no subscript formatting).
8. Do not leave incomplete sentences.
9. Ensure JSON is parseable with JSON.parse().

Return format EXACTLY:

\`\`\`json
{
  "concise": "<escaped markdown string>",
  "expert": "<escaped markdown string>"
}
\`\`\`

`,
    },
    {
        label: 'Fix grammar',
        prompt: 'Fix all grammar and spelling errors in the text, ensuring professional academic tone.',
    },
    {
        label: 'Simplify language',
        prompt: 'Simplify the language to be easily understood by an average student, keeping it engaging but educational.',
    },
    {
        label: 'Add examples',
        prompt: 'Add relevant academic examples to illustrate the concepts explained in the solution.',
    },
    {
        label: 'Make it bulleted',
        prompt: 'Convert appropriate sections into bullet points for better readability and structure.',
    },
    {
        label: 'Expand explanation',
        prompt: 'Expand the explanation with more details, reasoning, and depth suitable for higher marks.',
    },
];
