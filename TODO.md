# TODO: Remove Highlight Logic

- [x] Edit src/Pages/NewDashboard/Dashboard.js:
  - Remove selectedTileIndex state and setSelectedTileIndex
  - Remove passing "selected" and "highlightColor" props to Tile component
  - Remove setting selectedTileIndex in handleTileClick function

- [x] Edit src/CommonComponents/Tiles/Tiles.js:
  - Remove "selected" and "highlightColor" props from component signature
  - Update backgroundColor logic to always use bgcolor or default, ignoring highlight
