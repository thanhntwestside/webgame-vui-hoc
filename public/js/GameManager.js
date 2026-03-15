class GameManager {
  constructor() {
    this.currentClass = null;
    this.currentSubject = null;
    this.currentDiff = null;
    this.currentQuestions = [];
    this.score = 0;
    this.wrongCount = 0;
    this.currentSpeechText = "";
    this.bgmList = [
      "Image/nhac1.mp3",
      "Image/nhac2.mp3",
      "Image/nhac3.mp3",
      "Image/nhac4.mp3",
      "Image/nhac5.mp3",
      "Image/nhac6.mp3",
    ];
    this.currentBGM = null;
    this.lastBGM = null;

    // --- CÁC BIẾN CHO CHẾ ĐỘ THI ĐẤU ---
    this.isArenaMode = false;
    this.arenaTimer = null;
    this.timeLeft = 60;
    this.usedQuestions = [];
    this.highScore = 0;
  }

  // --- HÀM 1: SETUP CHẾ ĐỘ THƯỜNG ---
  async setupGame(lop, mon, doKho) {
    this.isArenaMode = false;
    this.currentClass = "lop" + lop;
    this.currentSubject = mon;
    this.currentDiff = doKho;
    const diffNames = { easy: "DỄ", medium: "VỪA", hard: "KHÓ" };

    const levelInfoElement = document.getElementById("current-level-info");
    if (levelInfoElement)
      levelInfoElement.innerHTML = `📚 Lớp ${lop} - Mức ${diffNames[this.currentDiff] || ""}`;

    // Ẩn đồng hồ thi đấu, hiện thanh máu
    document.getElementById("arena-timer-container").classList.add("hidden");
    document
      .getElementById("normal-score-container")
      .classList.remove("hidden");

    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
    document.getElementById("math-question").textContent =
      "⏳ Thỏ đang đi lấy đề thi...";
    document.getElementById("math-answers").innerHTML = "";

    await this.loadQuestionsFromSheet();
    this.playRandomBGM();
    this.showNextQuestion();
  }

  // --- HÀM 1.5: SETUP CHẾ ĐỘ THI ĐẤU (MỚI) ---
  async startArena(lop) {
    this.isArenaMode = true;
    this.currentClass = "lop" + lop;

    // Nạp dữ liệu lưu trữ từ MenuManager
    const state = menuManager.userData.arena[this.currentClass] || {
      currentScore: 0,
      used: [],
      highScore: 0,
    };
    this.score = state.currentScore;
    this.usedQuestions = state.used || [];
    this.highScore = state.highScore || 0;

    const levelInfoElement = document.getElementById("current-level-info");
    if (levelInfoElement)
      levelInfoElement.innerHTML = `🏆 ĐẤU TRƯỜNG LỚP ${lop} 🏆`;

    // Hiện đồng hồ, ẩn thanh máu bình thường
    document.getElementById("normal-score-container").classList.add("hidden");
    document.getElementById("arena-timer-container").classList.remove("hidden");

    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");
    document.getElementById("math-question").textContent =
      "⏳ Chuẩn bị tinh thần...";
    document.getElementById("math-answers").innerHTML = "";

    // Đẩy điểm thi đấu lên màn hình
    document.getElementById("arena-score-display").textContent = this.score;

    // Tải TOÀN BỘ câu hỏi của Lớp (Không phân biệt môn)
    await this.loadQuestionsFromSheet(true);
    this.playRandomBGM();
    this.showNextArenaQuestion();
  }

  // --- HÀM 2: GỌI API ---
  async loadQuestionsFromSheet(isArena = false) {
    try {
      const sheetURL =
        "https://script.google.com/macros/s/AKfycbwTW6IlsJLuFsd7yxMulKTx12EeUuFieVn9ChCrK4cyGiY7hJp51EaXZcoCq1Z4dG-csA/exec";
      const response = await fetch(sheetURL + "?sheet=" + this.currentClass);
      const allData = await response.json();

      if (isArena) {
        // Thi đấu: Lấy sạch mọi môn
        this.currentQuestions = allData;
      } else {
        // Chơi thường: Lọc theo Môn và Độ khó
        this.currentQuestions = allData.filter(
          (item) =>
            item.Mon === this.currentSubject && item.DoKho === this.currentDiff,
        );
      }
    } catch (error) {
      this.currentQuestions = [];
    }
  }

  // --- HÀM 3: ĐỒNG HỒ ĐẾM NGƯỢC THI ĐẤU ---
  startTimer() {
    clearInterval(this.arenaTimer);
    this.timeLeft = 60;
    document.getElementById("arena-timer-display").textContent = this.timeLeft;

    this.arenaTimer = setInterval(() => {
      this.timeLeft--;
      document.getElementById("arena-timer-display").textContent =
        this.timeLeft;
      if (this.timeLeft <= 0) {
        clearInterval(this.arenaTimer);
        this.handleArenaLoss("Hết 60s rồi, chậm quá!");
      }
    }, 1000);
  }

  // --- HÀM 4: HIỂN THỊ CÂU HỎI THI ĐẤU ---
  showNextArenaQuestion() {
    let pool = [];
    // Phân loại độ khó dựa theo mốc điểm
    if (this.score >= 150) {
      pool = this.currentQuestions.filter(
        (q) => q.DoKho === "hard" && !this.usedQuestions.includes(q.CauHoi),
      );
      if (pool.length === 0) return this.handleArenaWin(); // Hết câu hỏi Khó -> Phá Đảo
    } else if (this.score >= 50) {
      pool = this.currentQuestions.filter(
        (q) => q.DoKho === "medium" && !this.usedQuestions.includes(q.CauHoi),
      );
      if (pool.length === 0) return this.handleArenaWin();
    } else {
      pool = this.currentQuestions.filter(
        (q) => q.DoKho === "easy" && !this.usedQuestions.includes(q.CauHoi),
      );
      if (pool.length === 0) return this.handleArenaWin();
    }

    // Bốc ngẫu nhiên
    let randomIndex = Math.floor(Math.random() * pool.length);
    let qData = pool[randomIndex];

    this.currentTargetAnswer = qData.DapAnDung;
    this.currentAnswers = [
      qData.DapAnA,
      qData.DapAnB,
      qData.DapAnC,
      qData.DapAnD,
    ];
    let displayText = qData.CauHoi;

    // Giọng đọc tùy chỉnh theo môn bị bốc trúng
    let parsedData = this.parseAndRenderQuestion(qData.CauHoi);

    if (qData.Mon === "tieng-anh") {
      this.currentSpeechData = [
        { text: "Listen, " + parsedData.speechText, lang: "en-US" },
      ];
    } else {
      this.currentSpeechData = [
        { text: "Bạn nhỏ ơi, " + parsedData.speechText, lang: "vi-VN" },
      ];
    }

    this.currentQuestionText = parsedData.speechText;

    // QUAN TRỌNG: Dùng innerHTML để Game in được hình ảnh thay vì textContent
    document.getElementById("math-question").innerHTML = parsedData.htmlContent;
    document.getElementById("math-question").style.fontSize =
      parsedData.speechText.length > 20 ? "45px" : "60px";

    this.replayAudio();
    this.renderAnswerButtons();
    this.startTimer(); // BẮT ĐẦU ĐẾM NGƯỢC 60S
  }

  // --- HÀM 5: HIỂN THỊ CÂU HỎI CHẾ ĐỘ THƯỜNG ---
  showNextQuestion() {
    if (!this.currentQuestions || this.currentQuestions.length === 0) {
      document.getElementById("math-question").textContent =
        "Đề thi mục này đang được giáo viên cập nhật!";
      return;
    }
    let randomIndex = Math.floor(Math.random() * this.currentQuestions.length);
    let qData = this.currentQuestions[randomIndex];

    this.currentTargetAnswer = qData.DapAnDung;
    this.currentAnswers = [
      qData.DapAnA,
      qData.DapAnB,
      qData.DapAnC,
      qData.DapAnD,
    ];

    // --- ĐOẠN CODE BỊ THIẾU ĐÃ ĐƯỢC BỔ SUNG ---
    let parsedData = this.parseAndRenderQuestion(qData.CauHoi);

    if (qData.Mon === "tieng-anh") {
      this.currentSpeechData = [
        { text: "Listen, " + parsedData.speechText, lang: "en-US" },
      ];
    } else {
      this.currentSpeechData = [
        { text: "Bạn nhỏ ơi, " + parsedData.speechText, lang: "vi-VN" },
      ];
    }

    this.currentQuestionText = parsedData.speechText;

    // In câu hỏi ra màn hình (Hỗ trợ cả vẽ đồng hồ SVG)
    document.getElementById("math-question").innerHTML = parsedData.htmlContent;
    document.getElementById("math-question").style.fontSize =
      parsedData.speechText.length > 20 ? "45px" : "60px";

    this.replayAudio(); // Gọi Thỏ đọc tiếng
    this.renderAnswerButtons(); // Vẽ nút bấm
  }

  // --- HÀM 6: VẼ NÚT VÀ XỬ LÝ KẾT QUẢ ---
  renderAnswerButtons() {
    const ansDiv = document.getElementById("math-answers");
    ansDiv.innerHTML = "";
    this.currentAnswers.sort(() => Math.random() - 0.5);

    this.currentAnswers.forEach((ans) => {
      const btn = document.createElement("button");
      btn.className = "btn-huge";
      if (ans.toString().length > 3) btn.style.fontSize = "40px";
      btn.textContent = ans;

      btn.onclick = () => {
        window.speechSynthesis.cancel();
        this.stopTalkingRabbit();

        // -----------------------------------------
        // NHÁNH 1: ĐANG CHƠI CHẾ ĐỘ THI ĐẤU (ARENA)
        // -----------------------------------------
        if (this.isArenaMode) {
          clearInterval(this.arenaTimer); // Tạm dừng đồng hồ

          if (ans === this.currentTargetAnswer) {
            // ĐÚNG: Cộng 1 điểm, LƯU TRẠNG THÁI VÀO CƠ SỞ DỮ LIỆU
            this.score++;
            this.usedQuestions.push(this.currentQuestionText);
            if (this.score > this.highScore) this.highScore = this.score;

            // Cập nhật điểm vào đúng cái khung Đấu Trường
            document.getElementById("arena-score-display").textContent =
              this.score;

            // Lưu tiến trình ngầm
            menuManager.saveArenaProgress(
              this.currentClass,
              this.score,
              this.usedQuestions,
              this.highScore,
            );

            new Audio("Image/dung.mov").play().catch((e) => e);
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });

            const allBtns = document
              .getElementById("math-answers")
              .querySelectorAll("button");
            allBtns.forEach((b) => (b.style.pointerEvents = "none"));

            let winVoice = new SpeechSynthesisUtterance("Tuyệt!");
            winVoice.lang = "vi-VN";
            winVoice.onend = () => {
              this.showNextArenaQuestion();
            };
            window.speechSynthesis.speak(winVoice);
          } else {
            // SAI LÀ THUA LUÔN KHÔNG NÓI NHIỀU
            this.handleArenaLoss("Tiếc quá, sai mất rồi!");
          }
          return; // Kết thúc nhánh Arena
        }

        // -----------------------------------------
        // NHÁNH 2: CHẾ ĐỘ CHƠI BÌNH THƯỜNG
        // -----------------------------------------
        if (ans === this.currentTargetAnswer) {
          new Audio("Image/dung.mov").play().catch((e) => e);
          const allBtns = document
            .getElementById("math-answers")
            .querySelectorAll("button");
          allBtns.forEach((b) => (b.style.pointerEvents = "none"));
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

          this.score++;
          document.getElementById("score-display").textContent = this.score;
          document.getElementById("progress-fill").style.width =
            (this.score / 50) * 100 + "%";

          menuManager.saveProgress(
            this.currentClass,
            this.currentSubject,
            this.currentDiff,
            this.score,
          );

          let winVoice = new SpeechSynthesisUtterance("Hoan hô! Đúng rồi!");
          winVoice.lang = "vi-VN";
          winVoice.onstart = () => {
            this.startTalkingRabbit();
          };
          winVoice.onend = () => {
            this.stopTalkingRabbit();
            const rabbit = document.getElementById("rabbit-anim-container");
            rabbit.classList.add("jump-win");
            setTimeout(() => {
              rabbit.classList.remove("jump-win");
              this.checkMilestonesAndNext();
            }, 1000);
          };
          window.speechSynthesis.speak(winVoice);
        } else {
          this.wrongCount++;
          if (this.wrongCount >= 3) {
            if (this.currentBGM) this.currentBGM.pause();
            new Audio("Image/sai3.mp3").play().catch((e) => e);
            let lose3Voice = new SpeechSynthesisUtterance(
              "Tiếc quá bạn sai rồi!",
            );
            lose3Voice.lang = "vi-VN";
            window.speechSynthesis.speak(lose3Voice);
            document
              .getElementById("game-over-modal")
              .classList.remove("hidden");
          } else {
            new Audio("Image/sai.wav").play().catch((e) => e);
            let loseVoice = new SpeechSynthesisUtterance(
              "Chưa đúng rồi, thử lại nhé!",
            );
            loseVoice.lang = "vi-VN";
            window.speechSynthesis.speak(loseVoice);
            this.renderAnswerButtons();
          }
        }
      };
      ansDiv.appendChild(btn);
    });
  }

  // --- HÀM 7: XỬ LÝ THẮNG/THUA TRONG ĐẤU TRƯỜNG ---
  handleArenaLoss(reasonVoice) {
    if (this.currentBGM) this.currentBGM.pause();
    new Audio("Image/sai3.mp3").play().catch((e) => e);
    let loseVoice = new SpeechSynthesisUtterance(reasonVoice);
    loseVoice.lang = "vi-VN";
    window.speechSynthesis.speak(loseVoice);

    // XÓA TRẠNG THÁI ĐANG CHƠI DỞ, NHƯNG LƯU KỶ LỤC (High Score) LẠI
    menuManager.saveArenaProgress(this.currentClass, 0, [], this.highScore);
    menuManager.updateArenaUI(); // Cập nhật lại giao diện chữ ngoài menu

    // Đổi chữ hiển thị báo điểm
    document.querySelector("#game-over-modal p").innerHTML =
      `Bạn đã dừng chân ở câu số: <b>${this.score}</b><br>Đừng buồn, hãy thử lại nhé!`;
    document.getElementById("game-over-modal").classList.remove("hidden");
  }

  handleArenaWin() {
    clearInterval(this.arenaTimer);
    if (this.currentBGM) this.currentBGM.pause();
    confetti({ particleCount: 500, spread: 100, origin: { y: 0.3 } });

    // Xóa trạng thái chơi dở để chơi lại từ đầu
    menuManager.saveArenaProgress(this.currentClass, 0, [], this.highScore);
    document.getElementById("arena-win-modal").classList.remove("hidden");
  }

  startTalkingRabbit() {
    const rabbitContainer = document.getElementById("rabbit-anim-container");
    if (rabbitContainer) rabbitContainer.classList.add("talking-rabbit");
  }
  stopTalkingRabbit() {
    const rabbitContainer = document.getElementById("rabbit-anim-container");
    if (rabbitContainer) rabbitContainer.classList.remove("talking-rabbit");
  }

  replayAudio() {
    window.speechSynthesis.cancel();
    if (!this.currentSpeechData) return;
    this.currentSpeechData.forEach((speechObj, index) => {
      let utterance = new SpeechSynthesisUtterance(speechObj.text);
      utterance.lang = speechObj.lang;
      if (index === 0)
        utterance.onstart = () => {
          this.startTalkingRabbit();
        };
      if (index === this.currentSpeechData.length - 1)
        utterance.onend = () => {
          this.stopTalkingRabbit();
        };
      window.speechSynthesis.speak(utterance);
    });
  }

  checkMilestonesAndNext() {
    if (this.score >= 50) {
      this.score = 50;
      document.getElementById("score-display").textContent = this.score;
      document.getElementById("progress-fill").style.width = "100%";
      const subjectNames = {
        toan: "Toán",
        "tieng-viet": "Tiếng Việt",
        "tieng-anh": "Tiếng Anh",
      };
      const diffNames = { easy: "DỄ", medium: "VỪA", hard: "KHÓ" };
      const subName = subjectNames[this.currentSubject] || "môn này";
      const diffName = diffNames[this.currentDiff] || "";
      document.getElementById("level-up-message").innerHTML =
        `Tuyệt vời!<br>Bé đã đạt <b>50/50</b> điểm môn <b>${subName} (Mức ${diffName})</b>!<br>Bé muốn làm gì tiếp theo?`;
      document.getElementById("level-up-modal").classList.remove("hidden");
    } else if (this.score > 0 && this.score % 10 === 0) {
      const overlay = document.getElementById("celebration-overlay");
      const vid = document.getElementById("dance-video");
      overlay.classList.remove("hidden");
      vid.play();
      setTimeout(() => {
        overlay.classList.add("hidden");
        vid.pause();
        vid.currentTime = 0;
        this.showNextQuestion();
      }, 6000);
    } else {
      this.showNextQuestion();
    }
  }

  restartLevel(newDiff) {
    document.getElementById("level-up-modal").classList.add("hidden");
    document.getElementById("game-over-modal").classList.add("hidden");

    // Nếu là chế độ đấu trường, chơi lại từ 0
    if (this.isArenaMode) {
      this.startArena(this.currentClass.replace("lop", ""));
      return;
    }

    this.score = 0;
    document.getElementById("score-display").textContent = "0";
    document.getElementById("progress-fill").style.width = "0%";
    menuManager.saveProgress(
      this.currentClass,
      this.currentSubject,
      newDiff,
      this.score,
    );
    let numClass = this.currentClass.replace("lop", "");
    this.setupGame(numClass, this.currentSubject, newDiff);
  }

  nextLevelOrClass() {
    document.getElementById("level-up-modal").classList.add("hidden");
    this.score = 0;
    document.getElementById("score-display").textContent = "0";
    document.getElementById("progress-fill").style.width = "0%";
    if (this.currentDiff === "easy") {
      this.currentDiff = "medium";
    } else if (this.currentDiff === "medium") {
      this.currentDiff = "hard";
    } else {
      let currentGrade = parseInt(this.currentClass.replace("lop", ""));
      currentGrade++;
      this.currentClass = "lop" + currentGrade;
      this.currentDiff = "easy";
    }
    menuManager.saveProgress(
      this.currentClass,
      this.currentSubject,
      this.currentDiff,
      this.score,
    );
    let numClass = this.currentClass.replace("lop", "");
    this.setupGame(numClass, this.currentSubject, this.currentDiff);
  }

  playRandomBGM() {
    if (this.currentBGM) {
      this.currentBGM.pause();
      this.currentBGM.currentTime = 0;
    }
    let availableTracks = this.bgmList.filter(
      (track) => track !== this.lastBGM,
    );
    if (availableTracks.length === 0) availableTracks = this.bgmList;
    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    const selectedTrack = availableTracks[randomIndex];
    this.lastBGM = selectedTrack;
    this.currentBGM = new Audio(selectedTrack);
    this.currentBGM.volume = 0.25;
    this.currentBGM.loop = true;
    this.currentBGM.play();
  }
  // --- HÀM MỚI: DỊCH MẬT MÃ VÀ VẼ ĐỒNG HỒ ---
  parseAndRenderQuestion(text) {
    let speechText = text;
    let htmlContent = text;

    // Tìm xem trong câu hỏi có chứa mật mã [CLOCK:giờ:phút] không
    const clockMatch = text.match(/\[CLOCK:(\d+):(\d+)\]/);
    if (clockMatch) {
      let h = parseInt(clockMatch[1]);
      let m = parseInt(clockMatch[2]);

      // Tính toán góc quay của kim giờ và kim phút
      let hAngle = (h % 12) * 30 + (m / 60) * 30;
      let mAngle = m * 6;

      // Vẽ đồng hồ bằng code SVG cực nhẹ
      let clockSvg = `
        <div style="display:flex; justify-content:center; margin-top: 15px;">
          <svg width="140" height="140" viewBox="0 0 100 100" style="background:#fff; border-radius:50%; border:6px solid #3498db; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <text x="50" y="18" font-size="12" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#7f8c8d">12</text>
            <text x="86" y="54" font-size="12" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#7f8c8d">3</text>
            <text x="50" y="90" font-size="12" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#7f8c8d">6</text>
            <text x="14" y="54" font-size="12" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#7f8c8d">9</text>
            
            <line x1="50" y1="50" x2="50" y2="30" stroke="#2c3e50" stroke-width="6" stroke-linecap="round" transform="rotate(${hAngle} 50 50)"/>
            
            <line x1="50" y1="50" x2="50" y2="15" stroke="#e74c3c" stroke-width="4" stroke-linecap="round" transform="rotate(${mAngle} 50 50)"/>
            
            <circle cx="50" cy="50" r="4" fill="#f1c40f"/>
          </svg>
        </div>
      `;

      // Xóa cái đoạn mã [CLOCK...] đi để Thỏ không đọc ra tiếng
      speechText = text.replace(clockMatch[0], "").trim();
      // Thay đoạn mã đó bằng cái hình đồng hồ vừa vẽ
      htmlContent = text.replace(clockMatch[0], clockSvg);
    }

    return { speechText, htmlContent };
  }
}

const gameManager = new GameManager();
