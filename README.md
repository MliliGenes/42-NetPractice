# 🌐 NetPractice - Interactive Network Configuration Trainer

A modern, interactive web-based networking practice tool with an intuitive UI for mastering IP addressing, subnetting, routing, and network topology fundamentals.

## ✨ Key Features

### 🎯 Interactive Canvas
- **Infinite pan & zoom**: Navigate large topologies with ease (30%-300% zoom)
- **Draggable components**: Reposition interfaces, routing tables, and goals panel
- **Smart positioning**: Automatic interface placement with overlap prevention
- **Visual connections**: Color-coded lines showing network relationships

### 🎨 Modern UI/UX
- **Light theme**: Clean, professional design optimized for learning
- **Responsive layout**: Works on desktop, tablet, and large mobile devices
- **Smooth animations**: Polished transitions and hover effects
- **Slide-out logs**: Expandable sidebar with detailed simulation results

### 🔗 Connection Visualization
- **Gray dotted lines**: Host → Interface connections
- **Gray dashed lines**: Host → Routing Table connections
- **Blue dashed lines**: Network topology infrastructure
  - Host ↔ Router/Switch
  - Router ↔ Internet
  - Router ↔ Router
- **Real-time updates**: Lines redraw when components are dragged

### 🎓 Progressive Learning
- **10 Levels**: From basic IP configuration to complex multi-router setups
- **Instant validation**: Real-time feedback on configuration correctness
- **Per-goal tracking**: Visual indicators for each objective
- **Evaluation mode**: Timed challenge (3 random levels in 15 minutes)

### 🛠️ Enhanced Components
- **Draggable Interfaces**: Move to avoid overlaps and improve clarity
- **Draggable Routing Tables**: Orange-themed, compact, repositionable
- **Collapsible Logs**: Per-goal error tracking with color-coded messages
- **Canvas Controls**: Zoom in/out, reset view buttons

## 🚀 Quick Start

### Run locally
```bash
cd /home/sel/Downloads/net_practice
python3 -m http.server 8000
```

Then open http://localhost:8000/ in your browser.

### Direct file access
Simply open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

## 🎯 How to Use

1. **Start**: Enter your login or leave blank for evaluation mode
2. **Position**: Drag the goals panel to move it anywhere on screen (avoid topology obstruction)
3. **Configure**: Edit IP addresses, masks, and routes directly in the interface cards
4. **Check**: Click "Check again" to validate your configuration
5. **View Logs**: Click the logs button (bottom-left) to see detailed simulation results
6. **Progress**: Complete all goals to advance to the next level

## 📁 Structure

```
net_practice/
├── index.html           # Entry point
├── level1.html          # Level 1
├── level2.html          # Level 2
├── ...                  # Levels 3-10
├── end.html             # Completion page
├── css/
│   └── netpractice.css  # All styles (light theme, layout, components)
├── js/
│   ├── show.js          # UI rendering, logs sidebar, connection indicators
│   ├── sim.js           # Network simulation logic
│   └── level*.js        # Level-specific data
└── img/                 # Device images
```

## 🎨 Design System

### Colors
- **Background**: `#f8fafc` (light slate)
- **Surface**: `#ffffff` (white)
- **Text**: `#0f172a` (dark slate)
- **Brand**: `#2563eb` (blue)
- **Success**: `#16a34a` (green)
- **Warning**: `#d97706` (amber)
- **Danger**: `#dc2626` (red)

### Typography
- **Font**: Poppins (Google Fonts)
- **Weights**: 300, 400, 500, 600

## 🛠️ Technical Details

- Pure vanilla JavaScript (no frameworks)
- CSS3 with custom properties (CSS variables)
- SVG for connection visualization
- LocalStorage for login persistence
- Responsive viewport units (vh, vw)

## 📝 Level Goals

Each level presents networking challenges:
- Configure IP addresses and subnet masks
- Set up routing tables
- Enable communication between specific hosts/interfaces
- Work with switches, routers, and internet gateways

## 🔧 Customization

All visual aspects can be customized via CSS variables in `css/netpractice.css`:

```css
:root {
    --bg: #f8fafc;
    --surface: #ffffff;
    --brand: #2563eb;
    /* ... more variables */
}
```

## 📄 License

See `License` file for details.

## 🙏 Credits

Original NetPractice concept by 42 School.
UI/UX redesign with modern light theme, fullscreen layout, and sidebar logs.
