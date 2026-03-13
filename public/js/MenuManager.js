class MenuManager {
  constructor() {
    this.userData = {
      isLoggedIn: false,
      name: "",
      age: "",
      gender: "",
      avatar: "🦸‍♂️",
      lastSubject: "toan",
      progress: {},
      arena: {}, // KHO LƯU DỮ LIỆU THI ĐẤU MỚI
    };
    this.usersDB = {};
    this.apiUrl = "/api/users";
    this.init();
  }

  async init() {
    this.populateDropdowns();
    this.addEventListeners();
    await this.fetchUsersFromServer();
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser && this.usersDB[savedUser]) {
      this.userData = this.usersDB[savedUser];
      if (!this.userData.arena) this.userData.arena = {}; // Cập nhật cho tài khoản cũ
      this.userData.isLoggedIn = true;
    }
    this.checkLoginState();
  }

  async fetchUsersFromServer() {
    try {
      const response = await fetch(this.apiUrl);
      this.usersDB = await response.json();
    } catch (error) {
      console.error("Lỗi kết nối Máy chủ:", error);
    }
  }

  async saveUserToServer(userData) {
    try {
      await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error("Lỗi lưu dữ liệu:", error);
    }
  }

  async deleteUserFromServer(name) {
    try {
      await fetch(`${this.apiUrl}/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Lỗi xóa dữ liệu:", error);
    }
  }

  populateDropdowns() {
    const classSelect = document.getElementById("sel-class");
    const levelSelect = document.getElementById("sel-level");
    const arenaClassSelect = document.getElementById("sel-arena-class"); // Thêm cho Arena

    for (let i = 1; i <= 12; i++) {
      let opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `Lớp ${i}`;
      classSelect.appendChild(opt);
      let optArena = opt.cloneNode(true);
      arenaClassSelect.appendChild(optArena);
    }
    for (let i = 0; i < 50; i++) {
      let opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i === 0 ? `Khởi đầu (0 điểm)` : `Tầng ${i} (${i} điểm)`;
      levelSelect.appendChild(opt);
    }
  }

  refreshUserDropdown() {
    const select = document.getElementById("auth-select");
    select.innerHTML = '<option value="">-- Chọn hồ sơ có sẵn --</option>';
    for (const name in this.usersDB) {
      let opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `⭐ Bé ${name}`;
      select.appendChild(opt);
    }
    let optNew = document.createElement("option");
    optNew.value = "NEW";
    optNew.textContent = "➕ Tạo hồ sơ mới cho bé...";
    select.appendChild(optNew);
  }

  // --- HÀM MỚI: CẬP NHẬT GIAO DIỆN NÚT THI ĐẤU ---
  updateArenaUI() {
    if (!this.userData.isLoggedIn) return;
    const lop = "lop" + document.getElementById("sel-arena-class").value;
    const arenaData = this.userData.arena[lop] || {
      currentScore: 0,
      highScore: 0,
      used: [],
    };

    document.getElementById("arena-high-score").textContent =
      `Kỷ lục cao nhất: ${arenaData.highScore} điểm`;
    const btnArena = document.getElementById("btn-start-arena");

    // Nếu đang chơi dở thì hiện chữ Tiếp Tục
    if (arenaData.currentScore > 0) {
      btnArena.innerHTML = "▶ TIẾP TỤC THI ĐẤU";
      btnArena.style.backgroundColor = "#27ae60";
      btnArena.style.boxShadow = "0 4px #2ecc71";
    } else {
      btnArena.innerHTML = "🔥 THI TÀI NGAY";
      btnArena.style.backgroundColor = "#8e44ad";
      btnArena.style.boxShadow = "0 4px #732d91";
    }
  }

  checkLoginState() {
    const profileArea = document.getElementById("player-profile");
    const loginArea = document.getElementById("login-area");

    if (this.userData.isLoggedIn) {
      loginArea.classList.add("hidden");
      profileArea.classList.remove("hidden");
      document.getElementById("user-name").textContent =
        `${this.userData.name}`;
      const avatarDiv = document.getElementById("user-avatar-display");
      if (this.userData.avatar && this.userData.avatar.length > 20) {
        avatarDiv.innerHTML = `<img src="${this.userData.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        avatarDiv.innerHTML = this.userData.avatar || "🦸‍♂️";
      }

      const statsDiv = document.getElementById("user-stats");
      statsDiv.innerHTML = "";
      const subNames = {
        toan: "Toán",
        "tieng-viet": "Tiếng Việt",
        "tieng-anh": "Tiếng Anh",
      };
      const diffNames = { easy: "Dễ", medium: "Vừa", hard: "Khó" };

      for (let sub in this.userData.progress) {
        let p = this.userData.progress[sub];
        let numClass = p.class ? p.class.replace("lop", "") : "1";
        statsDiv.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #bdc3c7;">
            <span style="line-height: 1.4;">📌 <b>${subNames[sub]} ${numClass} (${diffNames[p.diff]})</b>:<br><span style="color:#e74c3c; font-weight:bold;">${p.score}/50 điểm</span></span>
            <button onclick="menuManager.startSpecificSubject('${sub}')" style="background-color: #2ecc71; color: white; border: none; padding: 6px 10px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 3px #27ae60; transition: transform 0.1s; min-width: 60px;">▶ Tiếp tục</button>
        </div>`;
      }
      this.updateArenaUI(); // Gọi cập nhật giao diện Thi Đấu
    } else {
      loginArea.classList.remove("hidden");
      profileArea.classList.add("hidden");
    }
  }

  async changeAvatar(avatarData) {
    if (!this.userData.isLoggedIn) return;
    this.userData.avatar = avatarData;
    this.usersDB[this.userData.name] = this.userData;
    await this.saveUserToServer(this.userData);
    this.checkLoginState();
    document.getElementById("avatar-modal").classList.add("hidden");
  }

  startSpecificSubject(subject) {
    let p = this.userData.progress[subject];
    let numClass = p.class ? p.class.replace("lop", "") : "1";
    this.userData.lastSubject = subject;
    this.usersDB[this.userData.name] = this.userData;
    this.saveUserToServer(this.userData);

    gameManager.score = p.score || 0;
    document.getElementById("score-display").textContent = gameManager.score;
    document.getElementById("progress-fill").style.width =
      (gameManager.score / 50) * 100 + "%";
    gameManager.setupGame(numClass, subject, p.diff);
  }

  addEventListeners() {
    const btnDelete = document.getElementById("btn-auth-delete");

    document.getElementById("sel-arena-class").onchange = () =>
      this.updateArenaUI();

    document.getElementById("btn-login").onclick = async () => {
      await this.fetchUsersFromServer();
      document.getElementById("auth-modal").classList.remove("hidden");
      this.refreshUserDropdown();
      document.getElementById("new-user-fields").classList.add("hidden");
      btnDelete.classList.add("hidden");
      document.getElementById("auth-select").focus();
    };

    document.getElementById("auth-select").onchange = (e) => {
      const val = e.target.value;
      if (val === "NEW") {
        document.getElementById("new-user-fields").classList.remove("hidden");
        document.getElementById("btn-auth-submit").textContent =
          "Tạo hồ sơ (Enter)";
        btnDelete.classList.add("hidden");
        document.getElementById("auth-name").focus();
      } else if (val !== "") {
        document.getElementById("new-user-fields").classList.add("hidden");
        document.getElementById("btn-auth-submit").textContent =
          "Tiếp tục (Enter)";
        btnDelete.classList.remove("hidden");
      } else {
        btnDelete.classList.add("hidden");
      }
    };

    document.getElementById("btn-auth-close").onclick = () => {
      document.getElementById("auth-modal").classList.add("hidden");
    };

    btnDelete.onclick = async () => {
      const nameToDelete = document.getElementById("auth-select").value;
      if (
        confirm(
          `⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ bé ${nameToDelete}?`,
        )
      ) {
        await this.deleteUserFromServer(nameToDelete);
        delete this.usersDB[nameToDelete];
        if (this.userData.name === nameToDelete) {
          this.userData = {
            isLoggedIn: false,
            name: "",
            age: "",
            gender: "",
            avatar: "🦸‍♂️",
            lastSubject: "toan",
            progress: {},
            arena: {},
          };
          localStorage.removeItem("currentUser");
          this.checkLoginState();
        }
        alert(`Đã xóa thành công!`);
        this.refreshUserDropdown();
        btnDelete.classList.add("hidden");
      }
    };

    document.getElementById("btn-auth-submit").onclick = async () => {
      const val = document.getElementById("auth-select").value;
      if (val === "NEW") {
        const nameInput = document.getElementById("auth-name").value.trim();
        const ageInput = document.getElementById("auth-age").value;
        const genderInput = document.getElementById("auth-gender").value;

        if (!nameInput || !ageInput)
          return alert("Vui lòng nhập đủ tên và tuổi!");
        if (this.usersDB[nameInput]) return alert("Tên này đã tồn tại!");

        const newUser = {
          name: nameInput,
          age: ageInput,
          gender: genderInput,
          avatar: genderInput === "nam" ? "🦸‍♂️" : "🧚‍♀️",
          lastSubject: "toan",
          progress: {
            toan: { class: "lop1", diff: "easy", score: 0 },
            "tieng-viet": { class: "lop1", diff: "easy", score: 0 },
            "tieng-anh": { class: "lop1", diff: "easy", score: 0 },
          },
          arena: {}, // Khởi tạo kho thi đấu cho tài khoản mới
        };

        await this.saveUserToServer(newUser);
        this.usersDB[nameInput] = newUser;
        localStorage.setItem("currentUser", nameInput);
        this.userData = { ...newUser, isLoggedIn: true };
        document.getElementById("auth-modal").classList.add("hidden");
        this.checkLoginState();
      } else if (val !== "") {
        this.userData = { ...this.usersDB[val], isLoggedIn: true };
        if (!this.userData.arena) this.userData.arena = {};
        localStorage.setItem("currentUser", val);
        document.getElementById("auth-modal").classList.add("hidden");
        this.checkLoginState();
      }
    };

    window.addEventListener("keydown", (e) => {
      const modal = document.getElementById("auth-modal");
      if (!modal.classList.contains("hidden")) {
        if (e.key === "Enter")
          document.getElementById("btn-auth-submit").click();
        else if (e.key === "Escape")
          document.getElementById("btn-auth-close").click();
      }
    });

    document.getElementById("avatar-upload").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.changeAvatar(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById("btn-logout").onclick = () => {
      if (confirm("Đăng xuất khỏi tài khoản này?")) {
        this.userData = { isLoggedIn: false, progress: {}, arena: {} };
        localStorage.removeItem("currentUser");
        this.checkLoginState();
      }
    };

    document.getElementById("btn-start-custom").onclick = () => {
      let selectedScore =
        parseInt(document.getElementById("sel-level").value) || 0;
      gameManager.score = selectedScore;
      document.getElementById("score-display").textContent = gameManager.score;
      document.getElementById("progress-fill").style.width =
        (gameManager.score / 50) * 100 + "%";
      gameManager.setupGame(
        document.getElementById("sel-class").value,
        document.getElementById("sel-subject").value,
        document.getElementById("sel-diff").value,
      );
    };

    // NÚT BẮT ĐẦU THI ĐẤU
    document.getElementById("btn-start-arena").onclick = () => {
      const lop = document.getElementById("sel-arena-class").value;
      gameManager.startArena(lop);
    };
  }

  saveProgress(currentClass, currentSubject, currentDiff, currentScore) {
    if (this.userData.isLoggedIn) {
      this.userData.lastSubject = currentSubject;
      this.userData.progress[currentSubject].class = currentClass;
      this.userData.progress[currentSubject].diff = currentDiff;
      this.userData.progress[currentSubject].score = currentScore;
      this.usersDB[this.userData.name] = this.userData;
      this.saveUserToServer(this.userData);
    }
  }

  // --- HÀM MỚI: LƯU TIẾN TRÌNH THI ĐẤU LÊN SERVER ---
  saveArenaProgress(lopClass, currentScore, usedArr, highScore) {
    if (this.userData.isLoggedIn) {
      if (!this.userData.arena) this.userData.arena = {};
      this.userData.arena[lopClass] = {
        currentScore: currentScore,
        used: usedArr,
        highScore: highScore,
      };
      this.usersDB[this.userData.name] = this.userData;
      this.saveUserToServer(this.userData);
    }
  }
}
const menuManager = new MenuManager();
