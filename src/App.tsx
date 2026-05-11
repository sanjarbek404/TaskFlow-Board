/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoardProvider } from "./context/BoardContext";
import { Board } from "./components/Board";

export default function App() {
  return (
    <BoardProvider>
      <Board />
    </BoardProvider>
  );
}
