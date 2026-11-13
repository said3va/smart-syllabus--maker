
const API_BASE = "http://localhost:8080";

const savedProgress = Number(localStorage.getItem("studyProgress") || 0);
document.getElementById("progressCount").textContent = savedProgress;

async function extractSyllabus() {
  const file = document.getElementById("syllabusFile").files[0];
  const status = document.getElementById("uploadStatus");

  if (!file) {
    alert("Please select a PDF or image first.");
    return;
  }

  status.textContent = "Extracting syllabus...";

  try {
    let text = "";

    if (file.type === "application/pdf") {
      const pdf = await pdfjsLib.getDocument({
        data: await file.arrayBuffer()
      }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n";
      }

      if (!text.trim()) {
        throw new Error("This PDF has no selectable text. Try uploading page images instead.");
      }
    } else {
      const result = await Tesseract.recognize(file, "eng");
      text = result.data.text;
    }

    document.getElementById("syllabusText").value = text;
    status.textContent = "Syllabus extracted successfully!";
  } catch (error) {
    status.textContent = error.message;
  }
}

async function callAI(task, data) {
  const response = await fetch(`${API_BASE}/api/ai/${task}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const result = await response.json();
  return result.output || JSON.stringify(result, null, 2);
}

async function showAI(task, data, outputId) {
  const output = document.getElementById(outputId);
  output.textContent = "AI is preparing your result...";

  try {
    output.textContent = await callAI(task, data);
  } catch (error) {
    output.textContent =
      "Could not connect to the AI server.\n" +
      error.message +
      "\n\nMake sure your Java backend is running.";
  }
}

function organizeSyllabus() {
  const syllabus = document.getElementById("syllabusText").value.trim();

  if (!syllabus) {
    alert("Upload or paste your syllabus first.");
    return;
  }

  showAI("organize", { syllabus }, "materialOutput");
}

function generateMaterial() {
  const topic = document.getElementById("topic").value.trim();
  const type = document.getElementById("materialType").value;

  if (!topic) {
    alert("Enter a subject or topic.");
    return;
  }

  showAI("study", { topic, type }, "materialOutput");
}

function generateExam() {
  const subject = document.getElementById("examSubject").value.trim();
  const topic = document.getElementById("examTopic").value.trim();

  if (!subject || !topic) {
    alert("Enter both subject and topic.");
    return;
  }

  showAI("questions", {
    topic: subject + ": " + topic,
    type: "mock exam"
  }, "examOutput");
}

function evaluateAnswer() {
  const answer = document.getElementById("studentAnswer").value.trim();

  if (!answer) {
    alert("Write your answer first.");
    return;
  }

  showAI("grade", {
    answer,
    question: "Evaluate this student answer. Explain strengths, mistakes and improvements."
  }, "gradeOutput");
}

function markStudied() {
  const count = Number(localStorage.getItem("studyProgress") || 0) + 1;
  localStorage.setItem("studyProgress", count);
  document.getElementById("progressCount").textContent = count;
}

function resetProgress() {
  if (!confirm("Reset your study progress?")) return;

  localStorage.setItem("studyProgress", "0");
  document.getElementById("progressCount").textContent = "0";
}
  
