const QUESTION_BANK = {
  lop1: {
    toan: {
      // Mức Dễ: Nhận biết số bằng cách đếm đồ vật (các bé không cần đọc chữ)
      easy: [
        {
          id: 1,
          content: "🍎🍎🍎 = ?",
          answers: ["1", "2", "3", "4"],
          correct: 2,
        }, // correct: 2 nghĩa là đáp án đúng nằm ở vị trí thứ 3 (số "3")
        {
          id: 2,
          content: "🐶🐶 = ?",
          answers: ["1", "2", "3", "4"],
          correct: 1,
        },
        { id: 3, content: "⭐ = ?", answers: ["1", "2", "3", "4"], correct: 0 },
        {
          id: 4,
          content: "🚗🚗🚗🚗 = ?",
          answers: ["2", "4", "3", "5"],
          correct: 1,
        },
      ],
      // Mức Vừa: Cộng trừ phạm vi 20
      medium: [
        {
          id: 5,
          content: "10 + 5 = ?",
          answers: ["12", "15", "18", "20"],
          correct: 1,
        },
        {
          id: 6,
          content: "18 - 4 = ?",
          answers: ["10", "12", "14", "16"],
          correct: 2,
        },
        {
          id: 7,
          content: "9 + 9 = ?",
          answers: ["18", "19", "17", "16"],
          correct: 0,
        },
      ],
      // Mức Khó: Cộng trừ phạm vi 20 - 100
      hard: [
        {
          id: 8,
          content: "50 + 25 = ?",
          answers: ["65", "70", "75", "80"],
          correct: 2,
        },
        {
          id: 9,
          content: "90 - 30 = ?",
          answers: ["50", "60", "70", "80"],
          correct: 1,
        },
        {
          id: 10,
          content: "45 + 15 = ?",
          answers: ["50", "60", "70", "80"],
          correct: 1,
        },
      ],
    },
  },
};
