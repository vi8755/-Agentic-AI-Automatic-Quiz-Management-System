from app.ai.topic_cleaner import clean_topics

raw_topics = [
    "A. SANDEEP",
    "ASSISTANT PROFESSOR",
    "Lecture #1",
    "Operating Systems",
    "CPU Scheduling",
    "Deadlock",
    "Memory Management",
    "Page 23",
    "UNIT II",
    "January 2025",
    "OS",
    "Paging",
    "Segmentation",
]

cleaned = clean_topics(raw_topics)

print("\nRaw Topics:")
print(raw_topics)

print("\nCleaned Topics:")
for topic in cleaned:
    print("-", topic)