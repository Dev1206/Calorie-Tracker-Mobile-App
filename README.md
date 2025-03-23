# Calorie Tracker App

A comprehensive mobile application built with React Native and Expo for tracking daily calorie intake, water consumption, and maintaining a healthy lifestyle.

## Features

- 📱 Cross-platform support (iOS & Android)
- 🍎 Food logging and calorie tracking
- 💧 Water intake monitoring
- 📊 Past entries visualization
- 👤 User profile management
- 📷 Barcode scanning for food items
- 🔔 Push notifications
- 🎨 Modern and intuitive UI with Expo

## Detailed Features

### 1. Dashboard & Home Screen
- Real-time calorie tracking with visual progress ring
- Daily macro-nutrient tracking (Proteins, Carbs, Fats)
- Quick-action buttons for common tasks
- Meal-wise calorie breakdown
- Daily summary and progress visualization
- Beautiful gradients and animations for better UX

### 2. Food Logging System
- Multiple meal types (Breakfast, Lunch, Dinner, Snacks)
- Detailed nutritional information tracking
  - Calories
  - Carbohydrates
  - Proteins
  - Fats
- Barcode scanning for quick food entry
- Custom food entry with manual input
- Meal timing tracking
- Food history and favorites

### 3. Water Intake Tracking
- Daily water intake monitoring
- Customizable daily water goals
- Quick-add options for different container sizes:
  - Small Glass (200ml)
  - Medium Glass (300ml)
  - Custom amount input
- Visual progress indicator
- Daily intake history
- Reset option for new day

### 4. Progress Monitoring
- Comprehensive history view of all entries
- Date-wise food log review
- Nutritional trends and patterns
- Water intake history
- Progress charts and visualizations
- Export capabilities for data analysis

### 5. Profile Management
- Personalized user profiles
- Customizable daily calorie goals
- Macro-nutrient target setting
- Personal details management
- Dietary preferences
- Goal setting and tracking

### 6. Smart Features
- Push notifications for:
  - Meal reminders
  - Water intake reminders
  - Goal achievements
  - Daily summaries
- Offline support with data sync
- Cross-device synchronization
- Dark/Light theme support
- Data backup and restore

### 7. User Interface
- Modern and intuitive design
- Smooth animations and transitions
- Interactive progress indicators
- Easy-to-use navigation
- Responsive layout for all screen sizes
- Accessibility features

## Tech Stack

- **Framework:** React Native with Expo
- **Navigation:** Expo Router
- **State Management:** React Native's built-in state management
- **Database:** Supabase
- **UI Components:** Custom components with Expo elements
- **Authentication:** @react-native-async-storage/async-storage
- **Styling:** React Native's built-in styling system
- **Icons:** @expo/vector-icons
- **Animations:** Moti and React Native Reanimated

## Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac users) or Android Studio (for Android development)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd calorieTracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

## Project Structure

```
calorieTracker/
├── app/                    # Main application screens and navigation
│   ├── components/        # Reusable UI components
│   ├── screens/          # Individual screen components
│   └── _layout.tsx       # App layout and navigation setup
├── assets/                # Static assets (images, fonts)
├── lib/                   # Utility functions and helpers
└── ...configuration files
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run the app in iOS simulator
- `npm run android` - Run the app in Android emulator
- `npm run web` - Run the app in web browser
- `npm test` - Run tests
- `npm run lint` - Run linting

## Key Features Implementation

- **Food Logging:** Track daily food intake with detailed nutritional information
- **Water Tracking:** Monitor daily water consumption with customizable goals
- **History View:** Review past entries and track progress over time
- **Profile Management:** Customize user settings and preferences
- **Barcode Scanning:** Quick food item lookup using device camera

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
