# NetPractice - Interactive Networking Simulator

A clean, modern web-based networking practice tool with an intuitive UI for learning IP addressing, routing, and network topology.

## 🎨 UI Features

### Fullscreen Topology View
- **100% viewport coverage**: The network topology canvas takes the entire screen for maximum visibility
- **Draggable goals panel**: Click and drag the goals header anywhere on screen to reposition it
- **Floating components**: Goals and controls overlay the topology without obstructing the diagram
- **Smart scrolling**: Large topologies scroll within the viewport, preventing page overflow

### Slide-out Logs Sidebar
- **Toggle button**: Bottom-left corner button with live error counter
  - Shows number of failed goals with red badge
  - Shows success indicator when all goals pass
- **Collapsible logs**: Click to open a right-side sidebar with detailed simulation logs
- **Per-goal details**: Each goal has its own expandable section with color-coded logs:
  - 🔴 **Red**: Errors and failures
  - 🟡 **Yellow**: Warnings
  - 🔵 **Blue**: Info messages (routing steps, packet flow)
  - 🟢 **Green**: Success messages

### Enhanced Visual Connections
- **Connection lines**: Clear lines between devices with rounded caps
- **Connection indicators**: Blue circles mark interface connection points
- **Visual hierarchy**: Proper z-index layering keeps interfaces and labels above connection lines

### Modern Interface Cards
- **Gradient backgrounds**: Subtle gradients on interface cards for depth
- **Focus states**: Input fields highlight on focus with blue outline
- **Improved typography**: Poppins font throughout for clean, modern look
- **Better spacing**: Optimized padding and margins for readability

### Responsive Design
- Viewport meta tags ensure proper scaling on all devices
- Flexible layouts adapt to different screen sizes
- Touch-friendly controls for tablets and mobile devices

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
