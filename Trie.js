const { applyPatch } = require('fast-json-patch')

// NOTE: many codes borrowed from MOBX STATE TREE

class TrieNode {
    children; // Map<string, TrieNode>;
  
    label; // string[];
  

    patch; // IJsonPatch | undefined;

    isRoot;
  
    // eslint-disable-next-line default-param-last
    constructor(label = [""], patch = null, isRoot = false) {
      this.children = new Map();
      this.label = label;
      this.patch = patch;
      this.isRoot = isRoot;
    }
  }
  
/**
 * Finds index at which arrays differ. Returns -1 if they are equal or one contains the other.
 */
function splitIndex(partsA, partsB) {
    const maxLength = Math.min(partsA.length, partsB.length);
    for (let i = 0; i < maxLength; i++) {
      if (partsA[i] !== partsB[i]) {
        console.log("diff",partsA, partsB)
        return i;
      }
    }
    return -1;
}
  
class PatchRadixTrie {
    root;
  
    constructor(patches = []) {
      this.root = new TrieNode([""], null, true);
      patches.forEach((patch, order) => this.insert(patch, order));
    }
  
    insert(patch, order) {
        patch.order = order;
      let node = this.root;
      const parts = splitJsonPath(patch.path);
      let depth = 0;
      while (depth < parts.length) {
        // Get path that is currently being processed, and unprocessed path parts.
        const path = parts[depth];
        const pathSuffix = parts.slice(depth);

        if (!node.children.has(path)) {
          node.children.set(path, new TrieNode(pathSuffix, patch));
          console.log("add new", node, new TrieNode(pathSuffix, patch))
          return;
        }
        const parent = node;
        node = node.children.get(path);
        // Check if existing path contains incoming path or vice versa.
        let index = splitIndex(pathSuffix, node.label);

        if (index === -1) {
          // Incoming patch should replace existing node.
          if (pathSuffix.length === node.label.length) {
            console.log("replace")
            node.patch = patch;
            node.children = new Map();
            return;
          }
          // Incoming patch should be parent of existing node.
          if (pathSuffix.length < node.label.length) {
            console.log("add as parent")
            const prefix = pathSuffix;
            const prefixNode = new TrieNode(prefix, patch);
            const suffix = node.label.slice(prefix.length);
            node.label = suffix;
            prefixNode.children.set(suffix[0], node);
            parent.children.set(path, prefixNode);
            return;
          }
          // Incoming patch should be child of existing node.
          if (pathSuffix.length > node.label.length) {
            console.log("add as child", pathSuffix, node.label)
            index = node.label.length;
          }
        } else {
          // Incoming patch splits existing node into two.
          const prefix = node.label.slice(0, index);
          const suffix = node.label.slice(index);
          console.log("splitting", prefix, suffix)
          node.label = suffix;

          const prefixNode = new TrieNode(prefix);
          prefixNode.children.set(suffix[0], node);
          parent.children.set(path, prefixNode);
          // Insert incoming patch as child of prefix node in next iteration.
          node = prefixNode;
        }
        depth += index;
      }
    }
  

    _getPathsRecursive(node) {
        const possiblePathsInTree = []
        if ( node.children.size == 0 ) {
            possiblePathsInTree.push([ node ])
        } else {
            for (const child of node.children.values()) {
                const subLists = this._getPathsRecursive(child)
                for (const sub of subLists) {
                    sub.unshift(node)
                    possiblePathsInTree.push(sub)
                }
            }
        }
        return possiblePathsInTree;
    }

    getPossiblePaths() {
        return this._getPathsRecursive(this.root)
    }

    getCompressedPatches() {
        const result = this.getPossiblePaths(this.root)
        let condensed = []
    
        for (let i = 0; i < result.length; i++) {
            const one = [ ...result[i]]
    
            let last = null
            while (last = one.pop()) {
                if (one[one.length-1].isRoot) {
                    condensed.push(last)
                    last = null
                    break;
                }
    
                if (one[one.length-1].patch == null) {
                    one[one.length-1].patch = last.patch
                    one[one.length-1].label = [ ...one[one.length-1].label, ...last.label ]
                } else {
                    if (one[one.length-1].patch.order < last.patch.order) {
                        // console.log("Patching...")
                        // console.log("Patch", {...last.patch, path : "/" + last.label.join('/')})
                        // console.log("Value", one[one.length-1].patch.value)
                        applyPatch(one[one.length-1].patch.value, [{...last.patch, path : "/" + last.label.join('/')}])
    
                    }
                }
            }
        }
    
        return condensed.filter((item, i, ar) => ar.indexOf(item) === i).map(item => { delete item.patch.order; return item.patch });
    }
}



function unescapeJsonPath(path) {
    return path.replace(/~1/g, "/").replace(/~0/g, "~")
}

function splitJsonPath(path) {
    // `/` refers to property with an empty name, while `` refers to root itself!
    const parts = path.split("/").map(unescapeJsonPath)
  
    const valid =
      path === "" ||
      path === "." ||
      path === ".." ||
      stringStartsWith(path, "/") ||
      stringStartsWith(path, "./") ||
      stringStartsWith(path, "../")
    if (!valid) {
      throw fail(`a json path must be either rooted, empty or relative, but got '${path}'`)
    }
  
    // '/a/b/c' -> ["a", "b", "c"]
    // '../../b/c' -> ["..", "..", "b", "c"]
    // '' -> []
    // '/' -> ['']
    // './a' -> [".", "a"]
    // /./a' -> [".", "a"] equivalent to './a'
  
    if (parts[0] === "") {
      parts.shift()
    }
    return parts
}

function stringStartsWith(str, beginning) {
    return str.indexOf(beginning) === 0
}

module.exports = PatchRadixTrie;