path = r"D:\nfvs_crm\src\app\app\tasks\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix &mdash; in option text to literal — (HTML entities don't render in <option> tags)
content = content.replace(
    '{emp.isFree ? "🟢" : "🟡"} {emp.firstName} {emp.lastName} &mdash; {emp.designation}',
    '{emp.isFree ? "🟢" : "🟡"} {emp.firstName} {emp.lastName} — {emp.designation}'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed &mdash; -> — in option label")
