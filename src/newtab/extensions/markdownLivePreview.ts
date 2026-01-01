import { ViewPlugin, Decoration, DecorationSet, ViewUpdate, EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

/**
 * Obsidian-style Live Preview for CodeMirror 6
 * Hides Markdown syntax markers except on the cursor line
 */
export const markdownLivePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    private lastCursorLine: number = -1;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      // Get current cursor line number
      const cursorPos = update.state.selection.main.head;
      const cursorLine = update.state.doc.lineAt(cursorPos).number;

      // Only rebuild decorations when document/viewport changes or cursor crosses line boundary
      if (
        update.docChanged ||
        update.viewportChanged ||
        (update.selectionSet && cursorLine !== this.lastCursorLine)
      ) {
        this.lastCursorLine = cursorLine;
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const { state } = view;

      // Cache lineAt results to avoid repeated computation
      const lineCache = new Map<number, number>();
      const getLineNumber = (pos: number): number => {
        if (!lineCache.has(pos)) {
          lineCache.set(pos, state.doc.lineAt(pos).number);
        }
        return lineCache.get(pos)!;
      };

      const cursorPos = state.selection.main.head;
      const cursorLine = getLineNumber(cursorPos);

      // Iterate through visible syntax tree
      for (const { from, to } of view.visibleRanges) {
        syntaxTree(state).iterate({
          from,
          to,
          enter: (node) => {
            const lineNumber = getLineNumber(node.from);

            // Skip decoration on cursor line
            if (lineNumber === cursorLine) {
              return;
            }

            // Hide header marks (# ## ###)
            if (node.name === 'HeaderMark') {
              builder.add(
                node.from,
                node.to,
                Decoration.replace({
                  inclusive: false,
                })
              );
            }

            // Hide emphasis marks (* _)
            if (node.name === 'EmphasisMark') {
              builder.add(
                node.from,
                node.to,
                Decoration.replace({
                  inclusive: false,
                })
              );
            }

            // Hide list markers (- * +)
            if (node.name === 'ListMark') {
              builder.add(
                node.from,
                node.to,
                Decoration.replace({
                  inclusive: false,
                })
              );
            }

            // Hide link marks ([ ] ( ))
            if (node.name === 'LinkMark' || node.name === 'URL') {
              // Only hide brackets, keep URL text visible
              if (node.name === 'LinkMark') {
                builder.add(
                  node.from,
                  node.to,
                  Decoration.replace({
                    inclusive: false,
                  })
                );
              }
            }

            // Hide code marks (` ``)
            if (node.name === 'CodeMark') {
              builder.add(
                node.from,
                node.to,
                Decoration.replace({
                  inclusive: false,
                })
              );
            }

            // Apply styling to formatted elements
            if (node.name === 'ATXHeading1') {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({ class: 'cm-heading-1' })
              );
            }

            if (node.name === 'ATXHeading2') {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({ class: 'cm-heading-2' })
              );
            }

            if (node.name === 'ATXHeading3') {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({ class: 'cm-heading-3' })
              );
            }

            if (node.name === 'Emphasis') {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({ class: 'cm-emphasis' })
              );
            }

            if (node.name === 'StrongEmphasis') {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({ class: 'cm-strong' })
              );
            }

            if (node.name === 'InlineCode') {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({ class: 'cm-inline-code' })
              );
            }

            if (node.name === 'Link') {
              builder.add(
                node.from,
                node.to,
                Decoration.mark({ class: 'cm-link' })
              );
            }
          },
        });
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
