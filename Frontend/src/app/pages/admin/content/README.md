# Admin Question Input Guide

Tai lieu nay dung de nhap question trong khu admin cho dung format va khong bi du field.

- `Hint` co the dung cho tat ca question types.
- `Hint` la goi y hien cho hoc sinh o man lam bai, tach rieng khoi `content`.
- `Question Data` chi nen dung cho metadata ky thuat nhu word bank, matching, sentence reorder, min/max words...

## 1. Single Question

### `QUALITATIVE_MC`, `READING_MC`, `CLOZE_MC`
- Can nhap: `Content`
- Co the nhap them: `Instruction`, `Hint`, `Explanation`
- Nhap `Options` A-D va chon 1 dap an dung
- `Image` chi hien voi cac dang duoc ho tro

### `TRUE_FALSE_NG`
- Can nhap: `Content`
- Co the nhap them: `Instruction`, `Hint`, `Explanation`, `Image`
- Khong can tao option tay
- He thong tu sinh 3 lua chon `TRUE`, `FALSE`, `NOT GIVEN`
- Chi can chon dap an dung

### `WORD_BANK_FILL`
- Can nhap: `Content`, `Correct Answer`, `Question Data`
- `Question Data` nen theo format:
```json
{
  "bank": ["analyze", "design", "ship"]
}
```

### `LIMITED_FILL`, `WORD_FORM`, `VERB_FORM`, `SENTENCE_REWRITE`
- Can nhap: `Content`, `Correct Answer`
- Co the nhap them: `Instruction`, `Hint`, `Explanation`

### `SENTENCE_REORDER`
- Can nhap: `Content`, `Correct Answer`, `Question Data`
- `Question Data` co the la mang JSON:
```json
["First, gather data", "then compare results"]
```

### `MATCHING`
- Can nhap: `Content`
- Nhap cac cap `Left` - `Right` trong editor
- He thong tu dong sinh `questionData` va `correctAnswer`
- Khong can go JSON tay neu dung editor

### `ESSAY_WRITING`
- Can nhap: `Content`, `Correct Answer`
- Co the nhap them: `Instruction`, `Hint`, `Explanation`, `Question Data`
- `Hint` dung de hien goi y cho hoc sinh, vi du cac y can co trong bai
- `Explanation` nen dung cho sample answer / reference de cham AI
- `Question Data` co the luu rubric:
```json
{
  "minWords": 150,
  "bandFocus": ["task response", "grammar"]
}
```

### `PRONUNCIATION`, `TOPIC_SPEAKING`
- Can nhap: `Content`, `Correct Answer`
- Co the nhap them: `Instruction`
- `Audio` chi hien khi dang cau hoi co ho tro

## 2. Question Group

### `READING_PASSAGE`
- Group can nhap: `Group Title`, `Instruction`, `Shared Content`
- Child question mac dinh: `READING_MC`

### `LISTENING_PASSAGE`
- Group can nhap: `Group Title`, `Instruction`, `Shared Content`, `Audio`
- Child question mac dinh: `READING_MC`

### `CLOZE_PASSAGE`
- Group can nhap: `Group Title`, `Instruction`, `Shared Content`
- Child question mac dinh: `CLOZE_MC`

### `WORD_BANK`
- Group can nhap: `Group Title`, `Instruction`, `Shared Content`, `Group Data`
- `Group Data` nen theo format:
```json
{
  "wordBank": ["because", "although", "however"]
}
```
- Child question mac dinh: `WORD_BANK_FILL`

### `MATCHING`
- Group can nhap: `Group Title`, `Instruction`, `Shared Content`, `Group Data` neu can dung chung
- Child question mac dinh: `MATCHING`

### `WRITING_TASK`
- Group can nhap: `Group Title`, `Instruction`, `Shared Content`, `Image`
- Child question mac dinh: `ESSAY_WRITING`

### `SPEAKING_TASK`
- Group can nhap: `Group Title`, `Instruction`, `Shared Content`, `Audio`
- Child question mac dinh: `TOPIC_SPEAKING`

## 3. Luu y

- Form admin da an cac field khong can cho tung loai.
- Neu doi type cau hoi, he thong chi gui cac field phu hop voi type moi.
- Cac package review/test phia user se tu an noi dung thuoc lesson VIP neu user khong co VIP.
