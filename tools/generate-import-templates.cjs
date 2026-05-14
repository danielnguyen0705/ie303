const fs = require("fs");
const path = require("path");
const XLSX = require("../Frontend/node_modules/xlsx");

const outputDir = path.join(__dirname, "..", "ImportTemplates", "unit-11");

const headers = {
  single_questions: [
    "questionType",
    "content",
    "instruction",
    "hint",
    "questionData",
    "explanation",
    "correctAnswer",
    "optionA",
    "optionB",
    "optionC",
    "optionD",
    "correctOption",
  ],
  question_groups: [
    "groupKey",
    "groupType",
    "title",
    "instruction",
    "sharedContent",
    "groupData",
  ],
  group_questions: [
    "groupKey",
    "questionType",
    "content",
    "instruction",
    "hint",
    "questionData",
    "explanation",
    "correctAnswer",
    "optionA",
    "optionB",
    "optionC",
    "optionD",
    "correctOption",
  ],
};

function mc(questionType, content, options, correctOption, explanation, instruction = "") {
  return {
    questionType,
    content,
    instruction,
    hint: "",
    questionData: "",
    explanation,
    correctAnswer: "",
    optionA: options[0] || "",
    optionB: options[1] || "",
    optionC: options[2] || "",
    optionD: options[3] || "",
    correctOption,
  };
}

function text(questionType, content, correctAnswer, explanation, instruction = "", questionData = "") {
  return {
    questionType,
    content,
    instruction,
    hint: "",
    questionData,
    explanation,
    correctAnswer,
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "",
  };
}

function group(groupKey, groupType, title, instruction, sharedContent, groupData = "") {
  return {
    groupKey,
    groupType,
    title,
    instruction,
    sharedContent,
    groupData,
  };
}

function child(groupKey, row) {
  return { groupKey, ...row };
}

const files = [
  {
    fileName: "unit-11-lesson-01-getting-started.xlsx",
    single: [
      mc(
        "QUALITATIVE_MC",
        "Choose the word that best completes the sentence: This unit is about ____.",
        ["future jobs", "ancient music", "housework", "weather maps"],
        "A",
        "The opening lesson introduces the topic and key vocabulary.",
      ),
      text(
        "LIMITED_FILL",
        "Complete the phrase: career ____",
        "choice",
        "Career choice is a common collocation.",
      ),
    ],
    groups: [],
    groupQuestions: [],
  },
  {
    fileName: "unit-11-lesson-02-language.xlsx",
    single: [
      mc(
        "QUALITATIVE_MC",
        "Choose the correct form: She ____ apply for that scholarship tomorrow.",
        ["is going to", "was going to", "has gone to", "goes to"],
        "A",
        "Use be going to for a planned future action.",
      ),
      text(
        "WORD_FORM",
        "Use the correct word form: The interview was very _____. (challenge)",
        "challenging",
        "The adjective challenging describes the interview.",
      ),
      text(
        "SENTENCE_REWRITE",
        "Rewrite with the same meaning: I plan to study abroad next year.",
        "I am going to study abroad next year.",
        "Be going to can express a plan.",
      ),
    ],
    groups: [],
    groupQuestions: [],
  },
  {
    fileName: "unit-11-lesson-03-reading.xlsx",
    single: [],
    groups: [
      group(
        "reading-1",
        "READING_PASSAGE",
        "Choosing a Career",
        "Read the passage and choose the best answer.",
        "Many students think carefully before choosing a career. They often consider their interests, skills, and future opportunities. Teachers and parents can give advice, but each student should make a decision that matches their goals.",
      ),
    ],
    groupQuestions: [
      child(
        "reading-1",
        mc(
          "READING_MC",
          "What do students often consider before choosing a career?",
          ["Their interests and skills", "Only their friends' opinions", "The weather", "Their lunch menu"],
          "A",
          "The passage says students consider interests, skills, and opportunities.",
        ),
      ),
      child(
        "reading-1",
        mc(
          "TRUE_FALSE_NG",
          "Parents and teachers can give students advice.",
          ["TRUE", "FALSE", "NOT GIVEN", ""],
          "A",
          "This information is stated in the passage.",
        ),
      ),
      child(
        "reading-1",
        mc(
          "TRUE_FALSE_NG",
          "Students should let parents make every career decision for them.",
          ["TRUE", "FALSE", "NOT GIVEN", ""],
          "B",
          "The passage says each student should make a decision that matches their goals.",
        ),
      ),
      child(
        "reading-1",
        mc(
          "TRUE_FALSE_NG",
          "The passage mentions a career fair at school.",
          ["TRUE", "FALSE", "NOT GIVEN", ""],
          "C",
          "The passage does not mention a career fair.",
        ),
      ),
    ],
  },
  {
    fileName: "unit-11-lesson-04-speaking.xlsx",
    single: [
      text(
        "TOPIC_SPEAKING",
        "Talk about a job you would like to do in the future. Say why it interests you.",
        "Student response should mention a job, at least two reasons, and one future plan.",
        "",
        "Prepare for one minute, then speak for one to two minutes.",
      ),
      text(
        "PRONUNCIATION",
        "Read aloud: I am going to become a software engineer.",
        "I am going to become a software engineer.",
        "Check stress, linking, and clear pronunciation.",
      ),
    ],
    groups: [],
    groupQuestions: [],
  },
  {
    fileName: "unit-11-lesson-05-listening.xlsx",
    single: [],
    groups: [
      group(
        "listening-1",
        "LISTENING_PASSAGE",
        "Career Advice Podcast",
        "Listen to the audio, then answer the questions.",
        "Transcript placeholder: A school counselor gives advice about choosing a career. She says students should learn about different jobs, talk to people in those fields, and practise useful skills.",
      ),
    ],
    groupQuestions: [
      child(
        "listening-1",
        mc(
          "READING_MC",
          "What does the counselor advise students to do?",
          ["Learn about different jobs", "Avoid talking to adults", "Choose quickly", "Ignore their skills"],
          "A",
          "The transcript says students should learn about different jobs.",
        ),
      ),
      child(
        "listening-1",
        text(
          "LIMITED_FILL",
          "Complete the sentence: Students should practise useful ____.",
          "skills",
          "The missing word is skills.",
        ),
      ),
    ],
  },
  {
    fileName: "unit-11-lesson-06-writing.xlsx",
    single: [],
    groups: [
      group(
        "writing-1",
        "WRITING_TASK",
        "Write About Future Plans",
        "Write a short paragraph about your future career plan.",
        "Your paragraph should include the job you want, reasons for your choice, and what you will do to prepare.",
      ),
    ],
    groupQuestions: [
      child(
        "writing-1",
        text(
          "ESSAY_WRITING",
          "Write 120-150 words about your future career plan.",
          "Rubric: clear topic sentence, two supporting reasons, future plan, correct grammar.",
          "Assess task response, organization, vocabulary, and grammar.",
          "",
          JSON.stringify({ minWords: 120, maxWords: 150, bandFocus: ["task response", "organization", "grammar"] }),
        ),
      ),
    ],
  },
  {
    fileName: "unit-11-lesson-07-communication-culture.xlsx",
    single: [
      mc(
        "QUALITATIVE_MC",
        "Which response is the most polite? Could you tell me more about your job?",
        ["Sure, I would be happy to.", "No, never.", "Stop asking.", "I do not care."],
        "A",
        "The first response is polite and cooperative.",
      ),
      text(
        "MATCHING",
        "Match each job with the correct workplace.",
        JSON.stringify({ doctor: "hospital", teacher: "school", chef: "restaurant" }),
        "Each job is matched with a common workplace.",
        "",
        JSON.stringify({
          left: ["doctor", "teacher", "chef"],
          right: ["hospital", "school", "restaurant"],
          answers: { doctor: "hospital", teacher: "school", chef: "restaurant" },
        }),
      ),
    ],
    groups: [],
    groupQuestions: [],
  },
  {
    fileName: "unit-11-lesson-08-looking-back-project.xlsx",
    single: [
      mc(
        "QUALITATIVE_MC",
        "Choose the best answer: A person who designs buildings is an ____.",
        ["architect", "actor", "athlete", "assistant"],
        "A",
        "An architect designs buildings.",
      ),
      text(
        "VERB_FORM",
        "Put the verb in the correct form: I enjoy ____ new skills. (learn)",
        "learning",
        "Enjoy is followed by a gerund.",
      ),
      text(
        "SENTENCE_REORDER",
        "Put the words in the correct order: going / am / I / to / apply",
        "I am going to apply.",
        "The sentence follows subject + be going to + verb.",
        "",
        JSON.stringify({ words: ["I", "am", "going", "to", "apply"] }),
      ),
    ],
    groups: [
      group(
        "project-1",
        "WORD_BANK",
        "Project Word Bank",
        "Use the word bank to complete the project sentences.",
        "Word bank for a short career project.",
        JSON.stringify({ wordBank: ["career", "skills", "interview", "future"] }),
      ),
    ],
    groupQuestions: [
      child(
        "project-1",
        text(
          "WORD_BANK_FILL",
          "A good ____ plan helps students prepare for work.",
          "career",
          "Career plan is the natural phrase.",
          "",
          JSON.stringify({ wordBank: ["career", "skills", "interview", "future"] }),
        ),
      ),
    ],
  },
];

function makeSheet(rows, sheetName) {
  return XLSX.utils.json_to_sheet(rows.length ? rows : [], {
    header: headers[sheetName],
  });
}

fs.mkdirSync(outputDir, { recursive: true });

for (const item of files) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, makeSheet(item.single, "single_questions"), "single_questions");
  XLSX.utils.book_append_sheet(workbook, makeSheet(item.groups, "question_groups"), "question_groups");
  XLSX.utils.book_append_sheet(workbook, makeSheet(item.groupQuestions, "group_questions"), "group_questions");
  XLSX.writeFile(workbook, path.join(outputDir, item.fileName));
}

const readme = [
  "# Unit 11 Import Templates",
  "",
  "These Excel files match the admin question importer in `QuestionPanel.tsx`.",
  "",
  "Required sheet names:",
  "- `single_questions`",
  "- `question_groups`",
  "- `group_questions`",
  "",
  "How to use:",
  "1. Open Admin Content Management.",
  "2. Select the target lesson.",
  "3. Click `Import Excel` and choose the matching file.",
  "",
  "The importer does not read `lessonId` from Excel. It imports into the currently selected lesson.",
  "",
  "Media files are not supported by this Excel importer yet. Add audio/image URLs manually after import if needed.",
  "",
  "Option-based question types use `optionA` to `optionD` and `correctOption`.",
  "Text-answer question types use `correctAnswer`.",
  "",
  "`TRUE_FALSE_NG` is option-based in this importer:",
  "- `optionA` = `TRUE`",
  "- `optionB` = `FALSE`",
  "- `optionC` = `NOT GIVEN`",
  "- set `correctOption` to `A`, `B`, or `C`",
  "",
  "The Reading template includes one correct `TRUE`, one correct `FALSE`, and one correct `NOT GIVEN` sample.",
].join("\n");

fs.writeFileSync(path.join(outputDir, "README.md"), readme);

console.log(`Generated ${files.length} workbooks in ${outputDir}`);
