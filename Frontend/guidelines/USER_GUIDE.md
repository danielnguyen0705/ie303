# UIFIVE - User Interface Guide

## 📚 Tổng quan

Hệ thống UIFIVE cung cấp một nền tảng học tiếng Anh hoàn chỉnh với gamification, bao gồm 13 trang chính dành cho người dùng.

## 🌐 Danh sách các trang User

### 1. **Dashboard** (Trang chủ)
**Đường dẫn:** `http://localhost:5173/`

**Mô tả:**
- Hiển thị tổng quan tiến trình học tập
- Unit progression với visual progress bars
- Stats cards: Coins, XP, Streak, Accuracy
- Quick access đến các units
- Daily challenges và achievements

**Tính năng chính:**
- ⚡ XP tracking
- 💰 Coins balance
- 🔥 Streak counter
- 🎯 Accuracy percentage
- 📊 Learning progress overview

---

### 2. **Unit Selection** (Chọn Unit) - MỚI
**Đường dẫn:** `http://localhost:5173/units`

**Mô tả:**
- Curriculum overview với learning path visualization
- Hiển thị tất cả units theo semester (Học kỳ 1 & 2)
- Progress tracking cho từng unit
- Review checkpoints và milestones
- Lock/unlock system

**Tính năng chính:**
- 📚 **Unit Grid Layout**:
  - Units 1-3: Small cards với progress bars
  - Units 4-5: Large horizontal cards
  - Units 6-10: Locked semester 2 units
- 🎯 **Progress States**:
  - ✅ Completed (100% - green check)
  - 🔄 In Progress (65% - progress bar)
  - 🔜 Coming Up Next (25% - yellow highlight)
  - 🔒 Locked (gray + lock icon)
- 🎓 **Review Checkpoints**:
  - Review 1-3: Prominent blue gradient card
  - Review 4-5: Dashed border locked state
  - Ôn tập HKI: Large milestone với badge
  - Ôn tập HKII: Final locked milestone
- 🏆 **Milestones Features**:
  - XP rewards display (500XP)
  - Time estimate (90 minutes)
  - Badge indicators
  - Unlock requirements

**UI Highlights:**
- Semester headers với rotation effects
- Dotted path connector giữa units
- Hover scale animations (1.02)
- Color-coded unit icons:
  - 🔵 Primary (blue) - Family, Community
  - 🟡 Secondary (yellow) - Health, Inventions
  - 🟢 Tertiary (green) - Music, Environment
- Grayscale effect cho locked units

**Learning Path Flow:**
```
Học kỳ 1:
Unit 1 → Unit 2 → Unit 3 → Review 1-3 
  ↓
Unit 4 → Unit 5 → Review 4-5
  ↓
Ôn tập HKI (Final Semester 1)
  ↓
Học kỳ 2: (LOCKED)
Unit 6 → Unit 7 → Unit 8 → Review 6-8
  ↓
Unit 9 → Unit 10 → Review 9-10
  ↓
Ôn tập HKII (Final Graduation)
```

---

### 3. **Unit View** (Chi tiết Unit)
**Đường dẫn:** `http://localhost:5173/unit/:unitId`

**Ví dụ:** `http://localhost:5173/unit/1`

**Mô tả:**
- Hiển thị chi tiết một unit học tập
- Danh sách lessons trong unit
- Pre-test và Post-test
- Progress tracking theo lesson

**Tính năng chính:**
- 📖 Lesson cards với status (completed/locked/current)
- ✅ Pre-test và Post-test
- 🎓 Learning path visualization
- 📈 Unit completion percentage

---

## 🎮 Bài tập (Exercises)

### 4. **Pronunciation Exercise**
**Đường dẫn:** `http://localhost:5173/exercise/pronunciation`

**Mô tả:**
- Luyện phát âm từ vựng và câu văn
- Record và playback audio
- Waveform visualization
- Scoring system

**Tính năng chính:**
- 🎤 Audio recording
- 📊 Waveform display
- ⭐ Pronunciation scoring
- 🔊 Listen & repeat

---

### 5. **Reading Exercise**
**Đường dẫn:** `http://localhost:5173/exercise/reading`

**Mô tả:**
- Đọc hiểu văn bản
- Multiple choice questions
- Highlight text feature
- Reading comprehension tracking

**Tính năng chính:**
- 📰 Long-form reading passages
- ❓ Comprehension questions
- 🖊️ Text highlighting
- ⏱️ Reading time tracking

---

### 6. **Quiz Exercise**
**Đường dẫn:** `http://localhost:5173/exercise/quiz`

**Mô tả:**
- Bài kiểm tra trắc nghiệm
- Multiple choice format
- Instant feedback
- Score calculation

**Tính năng chính:**
- ✅ Multiple choice questions
- 💯 Real-time scoring
- 🎯 Immediate feedback
- 📊 Performance analytics

---

### 7. **Listening Exercise** (MỚI)
**Đường dẫn:** `http://localhost:5173/exercise/listening`

**Mô tả:**
- Luyện nghe và sắp xếp câu
- Audio player với progress bar
- Word sorting task (drag & drop)
- Step-by-step progress

**Tính năng chính:**
- 🎧 Audio player với play/pause
- 📊 Progress bar với timestamps
- 🔤 Word sorting interface
- 💡 Pro tips với phonetic guidance
- ⏭️ Skip và Check Answer buttons
- 📈 Step progress (3/6)

**UI Elements:**
- Play button với pulse animation
- Draggable word chips
- Drop zone với dashed border
- Pro tip card với mentor image

---

## 📝 Test & Review

### 8. **Test Results** (MỚI)
**Đường dẫn:** `http://localhost:5173/test/results`

**Mô tả:**
- Hiển thị kết quả sau khi hoàn thành test
- Score visualization với circular progress
- Skill breakdown analysis
- Performance insights

**Tính năng chính:**
- 🎯 Score circle (85/100) với animated progress
- 📊 Bento grid stats:
  - ⏱️ Time taken
  - ✓ Accuracy percentage
  - ⚡ XP gained
  - 💰 Coins earned
- 📈 Skill breakdown với progress bars:
  - Listening
  - Reading
  - Grammar
  - Vocabulary
- 🎭 Radar chart visualization (balanced profile)
- 📋 Detailed stats table (Writing, Speaking)
- 🎬 Action buttons:
  - 👁️ Xem lại bài
  - 🔄 Làm lại
  - ➡️ Tiếp tục (gradient button)

**UI Highlights:**
- Circular progress animation
- Color-coded skills (blue, green)
- Pentagon radar chart
- Badge: "Excellent!" với stars
- Mastered/Improving status tags

---

### 9. **Test Review** (MỚI)
**Đường dẫn:** `http://localhost:5173/test/review`

**Mô tả:**
- Xem lại chi tiết từng câu hỏi đã làm
- So sánh đáp án đúng/sai
- Giải thích chi tiết
- Focused practice suggestions

**Tính năng chính:**
- 🗂️ Question navigation grid (50 câu):
  - 🟢 Green = Correct
  - 🔴 Red = Incorrect
  - Ring highlight = Current question
- 🔀 Toggle "Chỉ xem câu sai"
- 📊 Performance insights sidebar:
  - Grammar Focus: 92%
  - Vocabulary Level: B2+
- 📝 Question detail card:
  - Question number badge
  - Your answer (red highlight)
  - Correct answer (green highlight)
- 💡 Detailed explanation:
  - Vietnamese explanation
  - Key grammar rules
  - Example usage
- 🧭 Navigation:
  - ⬅️ Previous Question
  - 💾 Save to Review
  - ➡️ Next Incorrect
- 🎯 Related concepts:
  - Focused practice suggestions
  - Global rank display
  - Study recommendations

**UI Layout:**
- Two-column: Grid sidebar (left) + Detail (right)
- Color-coded question grid (5x10)
- Answer comparison boxes
- Explanation card với border accent

---

### 10. **Revision Test** (MỚI)
**Đường dẫn:** `http://localhost:5173/test/revision`

**Mô tả:**
- Bài kiểm tra ôn tập đầy đủ
- Split-screen: Reading passage + Questions
- Timer countdown
- Question grid navigation

**Tính năng chính:**
- 📖 Split-screen layout:
  - Left: Reading passage với image
  - Right: Question cards + Grid
- ⏱️ Timer header:
  - Countdown display (59:22)
  - Submit button (Nộp bài)
- ❓ Question cards:
  - TRUE / FALSE / NOT GIVEN format
  - Selected state highlighting
  - Numbered questions (01, 02, ...)
- 🗂️ Question grid sidebar (50 questions):
  - 7 columns grid
  - Color states:
    - 🔵 Blue = Answered
    - 🟡 Yellow = Flagged
    - ⚪ White = Unanswered
    - Ring = Current question
- 📊 Progress indicator:
  - 2/50 answered
  - 4% progress bar
- 🚩 Flag question feature
- 📈 Legend:
  - Done
  - Flagged
  - Left

**UI Features:**
- First letter drop cap trong passage
- Scrollable question area
- Sticky timer header
- Hover effects on buttons
- Question number với leading zeros

---

## 🏆 Community & Progress

### 11. **Leaderboard**
**Đường dẫn:** `http://localhost:5173/leaderboard`

**Mô tả:**
- Bảng xếp hạng người dùng
- Weekly và All-time rankings
- League system
- Competitive stats

**Tính năng chính:**
- 🥇 Top 3 podium display
- 📊 User ranking list
- 🏅 League badges
- 📈 XP và Streak stats
- 👥 Friend comparison

---

### 12. **Quests**
**Đường dẫn:** `http://localhost:5173/quests`

**Mô tả:**
- Daily và Weekly quests
- Achievement tracking
- Reward system
- Progress monitoring

**Tính năng chính:**
- 📅 Daily quests
- 📆 Weekly challenges
- 🎁 Reward collection
- ✅ Quest completion tracking
- 🏆 Achievement showcase

---

### 13. **Profile**
**Đường dẫn:** `http://localhost:5173/profile`

**Mô tả:**
- Thông tin cá nhân
- Learning statistics
- Achievements display
- Settings và preferences

**Tính năng chính:**
- 👤 User info và avatar
- 📊 Learning stats overview
- 🏆 Achievements wall
- ⚙️ Account settings
- 📈 Progress history

---

### 14. **Shop**
**Đường dẫn:** `http://localhost:5173/shop`

**Mô tả:**
- Cửa hàng items và power-ups
- Currency management
- Purchase history
- Premium features

**Tính năng chính:**
- 🛍️ Item catalog
- 💰 Coin balance
- 🎁 Power-ups và boosters
- 💎 Premium subscriptions
- 📜 Purchase history

---

## 🎨 Design System

### Color Palette
```css
Primary Blue:     #155ca5
Primary Container: #73aaf9
Success Green:    #006a35, #75f39c
Warning Yellow:   #fed023, #6f5900
Error Red:        #b31b25, #fb5151
Surface:          #f6f6ff, #eef0ff
Text:             #1e2e51
```

### Typography
- **Headlines**: Nunito (bold, extrabold)
- **Body**: Lexend (regular, medium)
- **Code/Mono**: Roboto Mono

### Components
- Rounded corners: `1rem` (default), `2rem` (lg), `3rem` (xl)
- Shadows: Float shadow cho cards
- Hover states: Scale transforms (1.02-1.05)
- Transitions: Smooth 200-300ms

---

## 🚀 Quick Navigation

### Learning Flow
```
Dashboard → Unit Selection → Unit View → Exercise → Test Results → Test Review
```

### Complete a Unit
```
1. Dashboard → Click "View All Units" hoặc Unit card
2. Unit Selection → Browse curriculum và chọn unit
3. Unit View → Start Lesson
4. Exercise (Pronunciation/Reading/Quiz/Listening)
5. Complete all lessons
6. Take Post-test
7. Test Results → View score và stats
8. Test Review → Review mistakes và learn
```

### Explore Curriculum
```
1. Dashboard → Navigate to Units
2. Unit Selection → View Học kỳ 1 & 2
3. Check progress states (Completed/In Progress/Locked)
4. Click Review Checkpoints
5. Complete milestones (Ôn tập HKI/HKII)
```

### Daily Routine
```
1. Check Daily Quests
2. Complete exercises
3. Check Leaderboard
4. Collect rewards from Shop
```

---

## 📱 Responsive Design

Tất cả các trang đều responsive và hoạt động tốt trên:
- 💻 Desktop (1920px+)
- 💻 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (< 768px)

### Mobile Features
- Bottom navigation bar
- Hamburger menu
- Touch-friendly buttons
- Optimized layouts

---

## 🎯 Gamification Elements

### Currencies
- 💰 **Coins**: Earn from exercises, spend in shop
- ⚡ **XP**: Experience points for leveling up
- 🔥 **Streak**: Consecutive days learning
- 🎯 **Accuracy**: Overall correctness percentage

### Progression
- **Levels**: Unlock as you gain XP
- **Badges**: Earn from achievements
- **Leagues**: Compete with others
- **Quests**: Daily và weekly challenges

---

## 🔐 Access Control

### User Pages (Public)
Tất cả người dùng có thể truy cập:
- Dashboard
- All Exercises
- Tests và Reviews
- Leaderboard
- Quests
- Profile
- Shop

### Admin Pages (Restricted)
Chỉ admin mới có quyền truy cập:
- `/admin/*` routes
- See `ADMIN_GUIDE.md` for details

---

## 💡 Tips & Best Practices

### For Students
1. **Start with Dashboard** - Xem overview trước khi bắt đầu
2. **Follow the path** - Làm lessons theo thứ tự
3. **Review mistakes** - Sử dụng Test Review để học từ sai lầm
4. **Daily practice** - Maintain streak để earn bonuses
5. **Use Pro Tips** - Đọc tips trong Listening Exercise

### For Teachers
1. **Track progress** - Monitor student stats
2. **Assign quests** - Create custom challenges
3. **Review results** - Analyze test results
4. **Provide feedback** - Comment on exercises

---

## 🆘 Troubleshooting

### Common Issues

**Không thấy progress?**
- Kiểm tra đã complete exercise chưa
- Refresh trang
- Clear browser cache

**Audio không chạy?**
- Kiểm tra browser permissions
- Enable microphone cho Pronunciation
- Check volume settings

**Questions không load?**
- Refresh trang
- Kiểm tra network connection
- Try different browser

---

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Check USER_GUIDE.md này
2. Check ADMIN_GUIDE.md (for admin features)
3. Contact support team
4. Report bugs on GitHub

---

## 🎓 Learning Paths

### Beginner Path
```
Dashboard → Unit 1 → Basic Exercises → Review → Practice
```

### Intermediate Path
```
Dashboard → Unit 3-5 → All Exercise Types → Tests → Leaderboard
```

### Advanced Path
```
Dashboard → Unit 6-8 → Revision Tests → Quests → Shop (Power-ups)
```

---

## ✨ New Features (Latest Update)

### Recently Added
- ✅ **Unit Selection** - Curriculum overview với learning path visualization
- ✅ **Listening Exercise** - Word sorting với audio player
- ✅ **Test Results** - Enhanced visualization với radar chart
- ✅ **Test Review** - Detailed explanation system
- ✅ **Revision Test** - Split-screen reading test

### Key Highlights
- 🎓 **Semester-based Learning**: Organized curriculum với Học kỳ 1 & 2
- 🔒 **Progressive Unlocking**: Lock/unlock system cho units
- 🏆 **Milestone Tracking**: Review checkpoints và final exams
- 📊 **Visual Progress**: Dotted path connectors và progress bars
- 🎨 **Color-coded Icons**: Easy identification of unit topics

### Coming Soon
- 🔜 Speaking Exercise (voice recognition)
- 🔜 Writing Exercise (essay grading)
- 🔜 Multiplayer Quizzes
- 🔜 AI Tutor Assistant
- 🔜 Advanced Analytics Dashboard