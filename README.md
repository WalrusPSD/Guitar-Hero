# Guitar Hero Clone

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![Tone.js](https://img.shields.io/badge/Tone.js-15.0-green.svg)](https://tonejs.github.io/)
[![RxJS](https://img.shields.io/badge/RxJS-7.8-orange.svg)](https://rxjs.dev/)
[![Vite](https://img.shields.io/badge/Vite-4.2-purple.svg)](https://vitejs.dev/)

A modern, web-based rhythm game inspired by Guitar Hero, built with TypeScript and reactive programming principles. This project demonstrates front-end development skills, audio processing, and real-time user interaction.

![Guitar Hero Screenshot](https://via.placeholder.com/800x400?text=Guitar+Hero+Screenshot)

## 🎸 Features

- **Score Counter**: Real-time scoring system that tracks your performance
- **Combo System**: Build up combos by hitting consecutive notes correctly
- **Multiple Song Selection**: Choose from a variety of songs including "Through The Fire And The Flames", "Runaway", "Rockin Robin" and more
- **Visual Feedback**: On-screen indication when keys are pressed
- **Quick Reset**: Press 'R' to restart the current song
- **Instrument Variety**: Play with different instrument sounds
- **Responsive Controls**: Intuitive keyboard controls for playing notes

## 🚀 Technologies Used

- **TypeScript**: For type-safe, maintainable code
- **Tone.js**: Audio framework for precise timing and playback
- **RxJS**: Reactive programming for handling complex user interactions
- **Vite**: Modern build tool for fast development and optimized production builds
- **Vitest**: Unit testing to ensure code quality and reliability

## 🎮 How to Play

1. **Get Started**: Click anywhere on the screen or press the Spacebar to start the game
2. **Select a Song**: Choose from a variety of songs using the dropdown menu and click "Change Song"
3. **Controls**:
   - Use the **H**, **J**, **K**, and **L** keys to hit notes in the corresponding columns (green, red, blue, yellow)
   - Press the key when the falling note reaches the hit zone at the bottom of the screen
   - For sustained notes, hold the key down until the note finishes
   - Press **R** to quickly restart the current song

4. **Scoring System**:
   - Hit notes accurately to earn points
   - Build combos by hitting consecutive notes without missing
   - Your combo multiplier increases after every 10 consecutive hits (1.0x → 1.2x → 1.4x → etc.)
   - Missing a note or hitting at the wrong time resets your combo to zero

5. **Visual Feedback**:
   - The key buttons highlight when pressed to show your inputs
   - The score, multiplier, and combo count are displayed on screen
   - High scores are saved locally so you can track your improvement

6. **Game End**:
   - The game ends after all notes have passed
   - Your final score is displayed along with the high score
   - You can restart immediately by pressing R or selecting a new song

## 💻 Installation and Setup

Prerequisites: Node.js installed on your system

1. Clone the repository:
```bash
git clone https://github.com/yourusername/guitar-hero.git
cd guitar-hero
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open the provided URL in your browser to play

## 🧪 Testing

Run the test suite to verify functionality:

```bash
npm test
```

For a visual test UI:

```bash
npm run test:ui
```

## 🔧 Development

Format code using Prettier:

```bash
npx prettier . --write
```

Build for production:

```bash
npm run build
```

## 🧠 Project Structure

```
src/
  ├── main.ts           # Application entry point and game logic
  ├── Song.ts           # Song class definition
  ├── SongLoader.ts     # Manages loading song data
  ├── SongList.ts       # Song library management
  ├── songDataBank.ts   # Storage for song metadata
  └── utils/            # Utility functions
```

## 📝 License

This project is licensed under the terms of the license included in the repository.

## 👨‍💻 About the Developer

This project demonstrates my proficiency in:
- Front-end web development with TypeScript
- Audio processing and manipulation
- Reactive programming with RxJS
- UI/UX design for interactive applications
- Test-driven development practices

Connect with me on [LinkedIn](https://linkedin.com/in/yourusername) or check out more of my projects on [GitHub](https://github.com/yourusername).
