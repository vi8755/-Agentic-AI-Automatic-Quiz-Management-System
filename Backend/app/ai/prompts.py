TOPIC_CLEANING_PROMPT = """
You are an expert university professor.

You will receive a noisy list of headings extracted from lecture notes, textbooks, or academic PDFs.

Your task is to identify genuine academic syllabus topics.

Remove:
- Teacher names
- Author names
- College or university names
- Department names
- Lecture numbers
- Unit/module names
- Page numbers
- Dates
- Headers and footers
- Mathematical expressions
- Process/resource notation
- Administrative text
- Duplicate or highly similar topics

Merge similar topics into a single meaningful topic.

Keep only concepts or syllabus topics that could be used to generate quiz questions.

Return ONLY a valid JSON array.

Topics:

{topics}
"""
QUIZ_PLANNER_PROMPT = """
You are an expert university professor and assessment designer.

Create a quiz plan based on the provided syllabus topics.

Requirements:

1. Group related topics together into meaningful sections.
2. Every section must contain:
   - section
   - topics
   - questions
3. Include the original syllabus topics inside the topics list.
4. Cover the syllabus as evenly as possible.
5. Every important topic should appear in exactly one section.
6. Respect the requested question count exactly.
7. Respect the requested difficulty.
8. Respect the requested Bloom level.
9. The sum of all questions must equal the requested question count.
10. Return ONLY valid JSON.

Example:

{{
  "title": "Operating Systems Quiz",
  "total_questions": 20,
  "difficulty": "Medium",
  "bloom_level": "Understand",
  "distribution": [
    {{
      "section": "CPU Scheduling",
      "topics": [
        "CPU Scheduling",
        "FCFS",
        "SJF",
        "Round Robin"
      ],
      "questions": 4
    }},
    {{
      "section": "Deadlock",
      "topics": [
        "Deadlock",
        "Deadlock Prevention",
        "Deadlock Avoidance",
        "Deadlock Detection"
      ],
      "questions": 4
    }}
  ]
}}

Topics:
{topics}

Question Count:
{question_count}

Difficulty:
{difficulty}

Bloom Level:
{bloom_level}
"""
MCQ_GENERATOR_PROMPT = """
You are an expert university professor.

Generate high-quality multiple-choice questions.

Requirements:

1. Use ONLY the provided topics.
2. Generate exactly the requested number of questions.
3. Each question must have:
   - question
   - options (exactly 4)
   - correct_answer
   - explanation
   - difficulty
   - bloom_level
   - topic
4. Only one option must be correct.
5. Incorrect options should be plausible.
6. Do not repeat questions.
7. Questions should test conceptual understanding.
8. Return ONLY valid JSON.

Example:

[
  {{
    "question": "Which scheduling algorithm may cause starvation?",
    "options": [
      "FCFS",
      "Round Robin",
      "Priority Scheduling",
      "FIFO"
    ],
    "correct_answer": "Priority Scheduling",
    "explanation": "Low priority processes may never execute.",
    "difficulty": "Medium",
    "bloom_level": "Understand",
    "topic": "CPU Scheduling"
  }}
]

Section:
{section}

Topics:
{topics}

Question Count:
{question_count}

Difficulty:
{difficulty}

Bloom Level:
{bloom_level}
"""

REGENERATE_MCQ_PROMPT = """
You are an expert university examination paper setter.

Your task is to regenerate ONE multiple-choice question for a teacher.

The regenerated question must:

• Stay within the same subject.
• Have similar difficulty.
• Test a different concept if possible.
• Avoid repeating wording.
• Avoid repeating answer choices.
• Avoid duplicating any existing question.
• Produce four plausible options.
• Have exactly one correct answer.
• Include a concise explanation.

Return ONLY valid JSON.
Example:

{{
    "question": "Which scheduling algorithm can lead to starvation?",

    "options": [
        "FCFS",
        "Priority Scheduling",
        "Round Robin",
        "FIFO"
    ],

    "correct_answer": "Priority Scheduling",

    "explanation": "Low-priority processes may wait indefinitely."
}}

Quiz Title:
{quiz_title}

Existing Questions:
{existing_questions}

--------------------------------

Question to Replace:

Question:
{question}

Options:
A. {option_a}
B. {option_b}
C. {option_c}
D. {option_d}

Correct Answer:
{correct_answer}

Explanation:
{explanation}

Generate a NEW MCQ.

Rules:

- Keep same subject
- Keep similar difficulty
- Do NOT copy wording
- Do NOT duplicate existing questions
- Do NOT reuse options
- Return ONLY JSON
"""

GENERATE_SINGLE_MCQ_PROMPT = """
You are an expert university examination paper setter.

Generate ONE multiple-choice question.

Topic:
{topic}

Difficulty:
{difficulty}

Existing Questions:
{existing_questions}

Rules:

- Generate exactly ONE MCQ.
- Do NOT generate a question similar to any of the existing questions above.
- Do NOT reuse the same wording.
- Do NOT test exactly the same concept.
- Four options (A, B, C, D).
- Only one correct answer.
- Include a short explanation.
- Return ONLY valid JSON.

{{
    "question": "...",
    "options": [
        "...",
        "...",
        "...",
        "..."
    ],
    "correct_answer": "A",
    "explanation": "..."
}}
"""
# ============================================================
# DESCRIPTIVE ANSWER EVALUATION
# ============================================================
DESCRIPTIVE_EVALUATION_PROMPT = """
You are an expert university professor and fair examination evaluator.

Your task is to evaluate a student's descriptive answer against:
- the question
- maximum marks
- expected answer
- evaluation rubric

Your goal is to award marks based on the QUALITY, CORRECTNESS,
DEPTH, and COMPLETENESS of the student's response.

============================================================
CORE EVALUATION PRINCIPLE
============================================================

Evaluate what the student actually demonstrates in their answer.

Do NOT award high marks merely because the answer contains several
correct keywords.

A student should receive credit when they demonstrate genuine
understanding of the required concepts, even if they use different
words or explanations from the expected answer.

Use the expected answer as a reference for important concepts,
but do NOT require exact wording, sentence matching, or identical
structure.

============================================================
EVALUATION CRITERIA
============================================================

Evaluate the answer using the following dimensions.

1. RELEVANCE
- Does the answer directly address the question?
- Ignore unrelated information.
- An answer containing technically correct but irrelevant information
  should not receive high marks.

2. CORRECTNESS
- Check whether the concepts, facts, explanations, calculations,
  steps, and conclusions are technically correct.
- Identify important factual or conceptual errors.
- Minor grammar or spelling mistakes should not reduce marks when
  the intended meaning is clear.

3. REQUIRED CONCEPTS
- Identify the important concepts required by the question.
- Check whether the student has covered those concepts.
- Do not treat simple keyword presence as proof of understanding.
- A concept that is mentioned but not meaningfully explained should
  receive limited credit when explanation is required.

4. CONCEPTUAL UNDERSTANDING
- Determine whether the student demonstrates actual understanding.
- Distinguish between:
    a) merely listing keywords,
    b) stating correct facts,
    c) explaining concepts correctly,
    d) applying or reasoning about concepts.
- Reward genuine explanation and understanding.

5. EXPLANATION AND DEPTH
- Consider how thoroughly the student explains the required concepts.
- Higher-mark questions generally require greater explanation,
  reasoning, coverage, or supporting detail than lower-mark questions.
- Do not award near-full marks to an answer that is only a short list
  of keywords when the question requires explanation or discussion.
- However, do not artificially reduce marks just because an answer is
  short if it is concise, accurate, complete, and sufficiently
  explained for the specific question.

6. COMPLETENESS
- Determine whether the student has answered ALL important parts of
  the question.
- If the question asks for multiple things, evaluate whether each part
  has been addressed.
- Missing an important part should reduce the marks appropriately.

7. EXAMPLES, STEPS, PROCEDURES, DIAGRAMS, OR APPLICATION
- If the question asks for an example, steps, procedure, comparison,
  calculation, diagram, application, justification, or other specific
  supporting material, evaluate whether it is provided correctly.
- Do not require an example or diagram when the question does not
  reasonably require one.
- When a required example, step, or supporting explanation is missing,
  reduce marks appropriately.

============================================================
QUESTION TYPE AND COMMAND WORD
============================================================

Pay attention to what the question is asking.

Interpret command words such as:

- "Define" → concise and accurate definition
- "Explain" → explanation and conceptual clarity
- "Describe" → appropriate description and important details
- "Compare" → meaningful comparison of the relevant items
- "Differentiate" → clear differences between the items
- "Discuss" → broader explanation with relevant points
- "Analyze" → reasoning and deeper examination
- "Evaluate" → judgment supported by reasoning
- "Illustrate" → explanation supported by an appropriate example
  or illustration where relevant
- "Calculate" → correct method, steps, and result where applicable
- "Justify" → reasoning supporting the conclusion

Do not apply these as rigid formulas. Interpret the actual question
before deciding what constitutes a complete answer.

============================================================
MARKS AND EXPECTED ANSWER DEPTH
============================================================

The maximum marks indicate the expected level of answer depth,
coverage, and completeness.

As a general guideline:

- 1–2 marks:
  Usually requires a concise, direct, correct response.

- 3–4 marks:
  Usually requires a clear explanation and coverage of the main
  required concepts.

- 5–6 marks:
  Usually requires a reasonably developed explanation, important
  concepts, and appropriate supporting details.

- 7–10+ marks:
  Generally requires a more comprehensive response with deeper
  explanation, broader coverage, reasoning, examples, steps, or
  other supporting details when appropriate.

IMPORTANT:
These are NOT fixed word-count requirements.

Do NOT use rules such as:
"5 marks = 120 words"
or
"10 marks = 250 words".

Answer length is ONLY a supporting signal.

A concise answer can receive high marks if it is technically
complete, accurate, and sufficiently explained for the question.

A long answer should NOT receive high marks merely because it has
many words. Long answers that are repetitive, irrelevant, incorrect,
or incomplete should receive marks according to their actual quality.

============================================================
KEYWORD AND SEMANTIC EVALUATION
============================================================

Do NOT grade by keyword counting.

For example, if a student writes:

"Encapsulation, inheritance, polymorphism."

Do not assume that all three concepts have been properly explained.

Instead determine whether the student demonstrates understanding
of those concepts.

Similarly, do not penalize a student simply because they use
different terminology from the expected answer when the underlying
concept is correct.

Evaluate SEMANTIC MEANING and TECHNICAL UNDERSTANDING rather than
exact word matching.

============================================================
PARTIAL MARKING
============================================================

Award partial marks when appropriate.

Examples:

- Correct concept but insufficient explanation → partial credit.
- Correct first part but incorrect second part → partial credit.
- Mostly correct answer with one minor error → high partial credit.
- Correct keywords but little explanation for a high-mark question
  → limited or moderate credit, depending on the question.
- Relevant but incomplete answer → partial credit.
- Incorrect answer with no meaningful understanding → very low or
  zero marks.

Do not use an all-or-nothing approach.

============================================================
WORD COUNT
============================================================

DO NOT impose a fixed minimum or maximum word count.

Do not directly calculate marks from word count.

Use answer length only to help determine whether the answer has
reasonable depth and completeness for the particular question.

A short but complete answer may deserve excellent marks.

A long but shallow or repetitive answer may deserve low marks.

============================================================
OVERALL MARKING
============================================================

After considering all relevant criteria, make an overall academic
judgment.

Award marks proportionally according to how well the student has
fulfilled the requirements of the question.

Do not mechanically average the evaluation criteria.

Different questions may place different importance on correctness,
depth, steps, examples, reasoning, completeness, or other factors.

Never award more than the maximum marks.

Never award negative marks.

An empty or unanswered response receives 0 marks.

A completely incorrect or irrelevant response should normally receive
0 or very low marks depending on whether any meaningful credit exists.

============================================================
FEEDBACK
============================================================

Provide concise and useful feedback.

The feedback should explain:
- what the student did correctly,
- what important information or explanation was missing,
- and why the awarded marks are appropriate.

For example:

"The answer correctly defines inheritance and mentions code reuse,
but it does not explain how inheritance works or provide the required
details for a 5-mark explanation question. More explanation of the
relationship between parent and child classes would improve the
answer."

Do not give vague feedback such as:
"Good answer."
"Needs improvement."

============================================================
IMPORTANT FAIRNESS RULES
============================================================

- Be fair and consistent.
- Do not favor long answers over concise complete answers.
- Do not favor exact wording from the expected answer.
- Do not reward keyword stuffing.
- Do not penalize minor language mistakes when the technical meaning
  is clear.
- Do not invent requirements that are not reasonably implied by the
  question.
- Judge the answer according to university-level academic standards.
- Consider the question, not just the student's answer in isolation.
- Consider the maximum marks when determining expected depth.
- Use the evaluation rubric as additional guidance.
- If the rubric conflicts with a reasonable interpretation of the
  question, carefully follow the provided rubric while maintaining
  fair academic evaluation.

============================================================
OUTPUT FORMAT
============================================================

Return ONLY valid JSON.

Do not include Markdown.
Do not include explanations outside the JSON.
Do not include ```json code fences.

Required JSON format:

{{
    "marks": 0,
    "feedback": "Concise explanation of why these marks were awarded."
}}

============================================================
QUESTION
============================================================

{question}

============================================================
MAXIMUM MARKS
============================================================

{max_marks}

============================================================
EXPECTED ANSWER
============================================================

{expected_answer}

============================================================
EVALUATION RUBRIC
============================================================

{evaluation_rubric}

============================================================
STUDENT ANSWER
============================================================

{student_answer}
"""