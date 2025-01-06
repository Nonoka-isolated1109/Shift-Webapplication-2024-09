const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]; //日曜はじまり

const calendar = document.querySelector(".calendar");
const monthHeader = document.querySelector("#month");
const weeks = document.querySelector(".week");

let currentDate = new Date(); // 現在の日付
let selectedDate = null; // 選択された日付

function displayCalendar() {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 頁の年月表示
    monthHeader.innerHTML = `${currentYear}年${currentMonth + 1}月`;

    const weekHeader = document.querySelector(".weekdays");
    weekHeader.innerHTML = "";

    WEEKDAYS.forEach(weekday => {
        const dayElement = document.createElement("div");
        dayElement.classList.add("weekday");
        dayElement.textContent = weekday;
        weekHeader.appendChild(dayElement);
    });

    let dayCounter = 1;
    for (let i = 0; i < weeks.clientHeight; i++) {
        const week = weeks[i];
        week.innerHTML = "";

        if (i === 0) {
            for (let j = 0; j < firstDayOfMonth; j++) {
                const day = document.createElement("div");
                day.classList.add("day", "disabled");
                week.appendChild(day);
            }

            // 月の最初の日から始める
            for (let j = firstDayOfMonth; j < 7; j++) {
                const day = createDayElement(dayCounter);
                week.appendChild(day);
                dayCounter++;
            }
        } else {
            for (let j = 0; j < 7; j++) {
                if (dayCounter > daysInMonth) {
                    const day = document.createElement("div");
                    day.classList.add("day", "disabled"); // 月の後の空白日
                    week.appendChild(day);
                } else {
                    const day = createDayElement(dayCounter);
                    week.appendChild(day);
                    dayCounter++;
                }
            }
        }
    }
    updateSalaryForMonth(currentMonth + 1, currentYear);
}

// シフトデータの取得
function getShiftData(date) {
    const storedShifts = JSON.parse(localStorage.getItem("shifts")) || [];

    // 日付に一致するシフト
    return storedShifts.find(shift => shift.date === date);
}

// 日付要素を生成する関数
function createDayElement(dayNumber) {
    const day = document.createElement("div");
    day.classList.add("day");
    day.textContent = dayNumber;

    // 現在の日付を強調
    const today = new Date();
    if (today.getFullYear() === currentDate.getFullYear() &&
        today.getMonth() === currentDate.getMonth() &&
        today.getDate() === dayNumber) {
        day.classList.add("today");
    }

    // シフトデータを取得して表示
    const currentDateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
    const shiftData = getShiftData(currentDateStr);

    // デバッグ: シフトデータをコンソールに出力
    console.log(`日付: ${currentDateStr} のシフトデータ: `, shiftData);

    if (shiftData) {
        const shiftInfo = document.createElement("div");
        shiftInfo.classList.add("shift-info");

        const jobData = getJobData(shiftData.job);

        // デバッグ: 取得した仕事データをコンソールに出力
        console.log(`シフトの仕事データ: `, jobData);

        shiftInfo.style.color = jobData.color || "#000000";

        // シフトの種類によって表示内容を変更
        if (jobData.salaryType === "時給") {
            shiftInfo.textContent = `${shiftData.startTime} ~ ${shiftData.endTime}`;
        } else if (jobData.salaryType === "コマ給") {
            shiftInfo.textContent = `コマ: ${shiftData.kommas.join(", ")}`;
        }

        // 日付の下にシフト情報を表示
        day.appendChild(shiftInfo);
    }

    // 日付をクリックして選択
    day.addEventListener("click", function () {
        if (selectedDate) {
            selectedDate.classList.remove("selected");
        }
        selectedDate = day;
        selectedDate.classList.add("selected");
        console.log(`${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${dayNumber}日が選択されました`);
    });

    return day;
}


// シフトデータを保存する
function saveShiftData(date, shiftData) {
    const storedShifts = JSON.parse(localStorage.getItem("shifts")) || {};

    // 時給かコマ給かで保存する内容を変更
    if (shiftData.type === "時給") {
        storedShifts[date] = {
            job: shiftData.job,
            type: "時給",
            startTime: shiftData.startTime,
            endTime: shiftData.endTime
        };
    } else if (shiftData.type === "コマ給") {
        storedShifts[date] = {
            job: shiftData.job,
            type: "コマ給",
            komaName: shiftData.komaName
        };
    }

    localStorage.setItem("shifts", JSON.stringify(storedShifts));
}

// 月毎の給与を表示
function updateSalaryForMonth(month, year) {
    const salary = calculateSalaryForMonth(month, year); // 給与のデータを取得する
    const transportFee = calculateTotalTransportFee(month, year); // 交通費を計算する
    document.getElementById("salaryAmount").textContent = `給与: ${salary}円`;
    document.getElementById("transportFee").textContent = `交通費: ${transportFee}円`;
    document.querySelector("#monthlySalary h2").textContent = `${month}月の給与:`;
}

// 合計の交通費を計算する関数
function calculateTotalTransportFee(month, year) {
    const shifts = JSON.parse(localStorage.getItem("shifts")) || {};
    let totalTransportFee = 0;
    let fixedFeeAddedJobs = new Set();  // 固定交通費を1度だけ追加

    for (let date in shifts) {
        const shift = shifts[date];
        const shiftDate = new Date(date);

        // 日付とシフトが正しく一致しているかを確認
        console.log("Processing shift for date:", shiftDate);

        if (shiftDate.getFullYear() === year && shiftDate.getMonth() + 1 === month) {
            const job = getJobData(shift.job); // 仕事データを取得
            console.log("Transport fee data for job:", job);

            if (job.transportType === "日毎") {
                totalTransportFee += job.transportFee;
            } else if (job.transportType === "固定" && !fixedFeeAddedJobs.has(shift.job)) {
                totalTransportFee += job.transportFee;
                fixedFeeAddedJobs.add(shift.job);
            }
        }
    }

    console.log("Total Transport Fee for the month:", totalTransportFee);
    return totalTransportFee;
}


// 仕事データを取得
function getJobData(jobName) {
    const jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    const jobData = jobs.find(job => job.name === jobName) || {};

    // 仕事データが見つからない場合のデバッグ
    if (!jobData.name) {
        console.log("Job not found:", jobName);
    } else {
        console.log("Job Data retrieved:", jobData);
    }
    return jobData;
}


// 前月に切替える
document.getElementById("prevMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    displayCalendar();
});

// 次月に切替える
document.getElementById("nextMonth").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    displayCalendar();
});

// ページ読み込み+カレンダーを表示
window.onload = function () {
    displayCalendar();
};
