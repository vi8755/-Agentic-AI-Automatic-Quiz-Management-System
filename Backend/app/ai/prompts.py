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