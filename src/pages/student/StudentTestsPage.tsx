import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, Award, CheckCircle2, AlertCircle, 
  HelpCircle, ChevronRight, Play, RotateCcw, ArrowLeft,
  Check, X, ShieldAlert, Sparkles, BookOpen
} from 'lucide-react';
import { api } from '../../utils/api';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation: string;
}

interface TestsResponse {
  tests: TestItem[];
  completedResults: TestResult[];
}

interface ResultsResponse {
  results: TestResult[];
}

interface TestItem {
  id: string;
  title: string;
  exam: string;
  subject: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  questionCount: number;
  questions?: Question[];
}

interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  submittedAt: string;
  answerKey?: Array<{
    questionId: string;
    correctAnswer: number;
    explanation: string;
  }>;
}

export const StudentTestsPage: React.FC = () => {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Active CBT state
  const [activeTest, setActiveTest] = useState<TestItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [qIndex: number]: boolean }>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [latestSubmissionResult, setLatestSubmissionResult] = useState<TestResult | null>(null);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    fetchTestsAndResults();
  }, []);

  const fetchTestsAndResults = async () => {
    setLoading(true);
    try {
      const [testsRes, resultsRes] = await Promise.all([
        api.get<TestsResponse>('/student/tests'),
        api.get<ResultsResponse>('/student/results')
      ]);
      if (testsRes.success && testsRes.data) {
        setTests(testsRes.data.tests || []);
      }
      if (resultsRes.success && resultsRes.data) {
        setResults((resultsRes.data.results || []).map((result: any) => ({
          ...result,
          testTitle: result.testTitle || result.testName,
          submittedAt: result.submittedAt || result.attemptDate,
        })));
      }
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!activeTest || reviewMode || showSubmitModal && secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTest, reviewMode]);

  const startTest = async (testId: string) => {
    try {
      const res = await api.get<TestItem>(`/student/tests/${testId}`);
      if (res.success && res.data && res.data.questions && res.data.questions.length > 0) {
        setActiveTest(res.data);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setMarkedForReview({});
        setSecondsRemaining(res.data.durationMinutes * 60);
        setLatestSubmissionResult(null);
        setReviewMode(false);
      } else {
        alert('Test questions could not be loaded.');
      }
    } catch (err) {
      console.error('Failed to start test:', err);
      alert('Error initiating test.');
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (reviewMode) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));
  };

  const handleClearResponse = () => {
    if (reviewMode) return;
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[currentQuestionIndex];
      return next;
    });
  };

  const toggleMarkForReview = () => {
    if (reviewMode) return;
    setMarkedForReview(prev => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex]
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitTest();
  };

  const handleSubmitTest = async () => {
    if (!activeTest || !activeTest.questions) return;
    setIsSubmitting(true);
    try {
      const answersPayload = activeTest.questions.map((q, idx) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null
      }));

      const res = await api.post<TestResult>(`/student/tests/${activeTest.id}/submit`, {
        answers: answersPayload
      });

      if (res.success && res.data) {
        const normalizedResult = {
          ...res.data,
          testTitle: res.data.testTitle || (res.data as any).testName,
          submittedAt: res.data.submittedAt || (res.data as any).attemptDate,
        };
        setLatestSubmissionResult(normalizedResult);
        if (res.data.answerKey) {
          const answerKey = new Map(
            res.data.answerKey.map((answer) => [answer.questionId, answer] as const)
          );
          setActiveTest((current) => current ? {
            ...current,
            questions: current.questions?.map((question) => {
              const answer = answerKey.get(question.id);
              return answer ? { ...question, correctAnswer: answer.correctAnswer, explanation: answer.explanation } : question;
            }),
          } : current);
        }
        setShowSubmitModal(false);
        setReviewMode(true);
        fetchTestsAndResults();
      } else {
        alert(res.error || 'Failed to submit test.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Submission failed. Check network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // If student is currently taking a test or reviewing solutions
  if (activeTest && activeTest.questions && activeTest.questions.length > 0) {
    const totalQuestions = activeTest.questions.length;
    const currentQ = activeTest.questions[currentQuestionIndex];
    const answeredCount = Object.keys(selectedAnswers).length;
    const reviewedCount = Object.values(markedForReview).filter(Boolean).length;
    const unattemptedCount = totalQuestions - answeredCount;

    return (
      <div className="space-y-6">
        {/* CBT Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#00245C]">
                {activeTest.exam}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {activeTest.subject}
              </span>
              {reviewMode && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Solution & Review Mode
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#00245C]">{activeTest.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {!reviewMode ? (
              <>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold border ${
                  secondsRemaining < 300 
                    ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' 
                    : 'bg-blue-50 text-[#00245C] border-blue-100'
                }`}>
                  <Clock className="w-5 h-5" />
                  {formatTimer(secondsRemaining)}
                </div>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2.5 bg-[#00245C] hover:bg-blue-600 text-white font-medium rounded-xl transition shadow-sm"
                >
                  Submit Test
                </button>
              </>
            ) : (
              <button
                onClick={() => { setActiveTest(null); setReviewMode(false); }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" /> Exit to All Tests
              </button>
            )}
          </div>
        </div>

        {/* Score Banner if in Review Mode */}
        {latestSubmissionResult && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black">
                {latestSubmissionResult.percentage}%
              </div>
              <div>
                <div className="text-blue-100 text-sm font-medium">Test Submitted Successfully</div>
                <div className="text-2xl font-extrabold">
                  Your Score: {latestSubmissionResult.score} / {latestSubmissionResult.totalMarks} Marks
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl text-sm">
              <div>
                <span className="text-blue-200">Correct:</span>{' '}
                <span className="font-bold text-white">{latestSubmissionResult.correctAnswers}</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div>
                <span className="text-blue-200">Wrong:</span>{' '}
                <span className="font-bold text-white">{latestSubmissionResult.wrongAnswers}</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div>
                <span className="text-blue-200">Unattempted:</span>{' '}
                <span className="font-bold text-white">{latestSubmissionResult.unattempted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main CBT Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question area (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                  <span className="text-emerald-600 font-semibold">+{(activeTest.totalMarks / totalQuestions).toFixed(1)} Marks</span>
                  {activeTest.negativeMarking > 0 && (
                    <span className="text-rose-500 font-semibold">-{activeTest.negativeMarking} Neg</span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-lg font-medium text-[#00245C] mb-8 leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                  const isCorrect = currentQ.correctAnswer === optIdx;

                  let optionStyle = "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 text-gray-800";
                  if (reviewMode) {
                    if (isCorrect) {
                      optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      optionStyle = "border-rose-400 bg-rose-50 text-rose-900";
                    } else {
                      optionStyle = "border-gray-200 opacity-60";
                    }
                  } else if (isSelected) {
                    optionStyle = "border-[#00245C] bg-blue-50/60 text-[#00245C] font-medium shadow-sm";
                  }

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border-2 transition cursor-pointer ${optionStyle}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                        isSelected 
                          ? 'border-[#00245C] bg-[#00245C] text-white' 
                          : 'border-gray-300 bg-white text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <div className="flex-1 text-sm md:text-base leading-snug">
                        {opt}
                      </div>
                      {reviewMode && isCorrect && (
                        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {reviewMode && isSelected && !isCorrect && (
                        <X className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Solution Explanation if in review mode */}
              {reviewMode && currentQ.explanation && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 mb-6 text-sm">
                  <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Explanation & Concept:
                  </div>
                  <div className="text-amber-800 leading-relaxed whitespace-pre-line">
                    {currentQ.explanation}
                  </div>
                </div>
              )}

              {/* Question Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {!reviewMode && (
                    <>
                      <button
                        onClick={toggleMarkForReview}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium border transition ${
                          markedForReview[currentQuestionIndex]
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {markedForReview[currentQuestionIndex] ? '★ Marked for Review' : '☆ Mark for Review'}
                      </button>
                      {selectedAnswers[currentQuestionIndex] !== undefined && (
                        <button
                          onClick={handleClearResponse}
                          className="px-3 py-2 rounded-xl text-xs md:text-sm font-medium text-gray-500 hover:text-rose-600 hover:bg-gray-50 transition"
                        >
                          Clear Selection
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-5 py-2 bg-[#00245C] hover:bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Palette Sidebar (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#00245C] text-sm mb-3">Question Palette</h3>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {activeTest.questions.map((_, idx) => {
                  const isCurrent = currentQuestionIndex === idx;
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isMarked = markedForReview[idx];

                  let btnBg = "bg-gray-100 text-gray-700 hover:bg-gray-200";
                  if (isMarked) {
                    btnBg = "bg-purple-600 text-white font-bold";
                  } else if (isAnswered) {
                    btnBg = "bg-emerald-600 text-white font-bold";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition relative ${btnBg} ${
                        isCurrent ? 'ring-2 ring-offset-1 ring-[#00245C] shadow-sm scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs border-t border-gray-100 pt-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-600" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-purple-600" />
                  <span>Marked for Review ({reviewedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-gray-200" />
                  <span>Unattempted ({unattemptedCount})</span>
                </div>
              </div>

              {!reviewMode && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="w-full py-2.5 bg-[#00245C] hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                  >
                    Finish & Submit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-lg font-bold text-[#00245C]">Submit Mock Test</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to finish this test? Once submitted, your score will be calculated and saved to your performance record.
              </p>
              
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl mb-6 text-center text-xs">
                <div>
                  <div className="font-bold text-emerald-600 text-base">{answeredCount}</div>
                  <div className="text-gray-500">Answered</div>
                </div>
                <div>
                  <div className="font-bold text-purple-600 text-base">{reviewedCount}</div>
                  <div className="text-gray-500">Review</div>
                </div>
                <div>
                  <div className="font-bold text-rose-500 text-base">{unattemptedCount}</div>
                  <div className="text-gray-500">Pending</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Return to Test
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitTest}
                  className="px-5 py-2 bg-[#00245C] hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition"
                >
                  {isSubmitting ? 'Calculating Score...' : 'Yes, Submit Test'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal List View: Available Tests & Performance Overview
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#00245C] mb-2">
          <Award className="w-3.5 h-3.5" />
          <span>Computer Based Test (CBT) Series</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#00245C]">Mock Tests & Practice Exams</h1>
        <p className="text-sm text-gray-600 mt-1">
          Simulate actual GATE exam conditions with negative marking and instant concept solutions.
        </p>
      </div>

      {/* Available Tests Grid */}
      <div>
        <h2 className="text-lg font-bold text-[#00245C] mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#00245C]" /> Available Tests for Your Enrolled Subjects
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No mock tests available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const previousAttempt = results.find(r => r.testId === test.id);

              return (
                <div 
                  key={test.id} 
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#00245C]">
                        {test.exam}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {test.subject}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#00245C] mb-2">{test.title}</h3>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl text-xs mb-4 text-center">
                      <div>
                        <div className="text-gray-400">Duration</div>
                        <div className="font-semibold text-gray-700">{test.durationMinutes}m</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Questions</div>
                        <div className="font-semibold text-gray-700">{test.questionCount} Qs</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Marks</div>
                        <div className="font-semibold text-gray-700">{test.totalMarks}</div>
                      </div>
                    </div>

                    {previousAttempt && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 mb-4 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-medium">Last Score:</span>
                        <span className="font-bold text-emerald-800">
                          {previousAttempt.score}/{previousAttempt.totalMarks} ({previousAttempt.percentage}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => startTest(test.id)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#00245C] hover:bg-blue-600 text-white font-medium rounded-xl text-sm transition shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {previousAttempt ? 'Retake Test' : 'Start CBT Test'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Test History */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#00245C] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Recent Test Submissions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Correct / Wrong</th>
                  <th className="py-3 px-4">Attempted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-[#00245C]">
                      {res.testTitle}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {res.score} / {res.totalMarks}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        res.percentage >= 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {res.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="text-emerald-600 font-semibold">{res.correctAnswers} Correct</span>
                      {' / '}
                      <span className="text-rose-500 font-semibold">{res.wrongAnswers} Wrong</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(res.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestsPage;
