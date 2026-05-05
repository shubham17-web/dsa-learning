# Detailed content for DSA Learning Modules
# This keeps main.py clean while providing high-quality C++ educational material.

MODULES_DETAILED_CONTENT = {
    "arrays-strings": {
        "long_description": """
### 📦 Arrays & Strings in C++
Arrays are the most fundamental data structure. In C++, we primarily use `std::vector` for dynamic arrays and `std::string` for text.

#### Key Concepts:
- **Random Access**: Access any element in $O(1)$ time.
- **Memory Contiguity**: Elements are stored side-by-side, making them cache-friendly.
- **Two-Pointer Technique**: Essential for problems like reversing an array or finding pairs.

```cpp
#include <iostream>
#include <vector>
#include <string>

int main() {
    // Dynamic array (vector)
    std::vector<int> nums = {10, 20, 30};
    nums.push_back(40); // O(1) amortized
    
    // Strings are effectively vectors of chars
    std::string s = "CPP DSA";
    std::cout << s[0] << std::endl; // 'C'
    
    return 0;
}
```
        """,
        "has_code_runner": True
    },
    "linked-lists": {
        "long_description": """
### 🔗 Linked Lists
A linked list is a linear data structure where elements are not stored at contiguous memory locations. Each element is an object called a **Node**.

#### Key Concepts:
- **Dynamic Size**: Easily grow or shrink by updating pointers.
- **Insert/Delete**: $O(1)$ if you have the pointer to the node.
- **Search**: $O(n)$ as you must traverse from the head.

```cpp
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};
```
        """,
        "has_code_runner": True
    },
    "stacks-queues": {
        "long_description": """
### 📚 Stacks & Queues
**Stacks** follow LIFO (Last In First Out), while **Queues** follow FIFO (First In First Out).

#### Applications:
- **Stack**: Function calls, undo logic, expression parsing.
- **Queue**: Task scheduling, BFS (Breadth-First Search).

```cpp
#include <stack>
#include <queue>

std::stack<int> s;
s.push(1); s.pop();

std::queue<int> q;
q.push(1); q.pop();
```
        """,
        "has_code_runner": True
    },
    "trees-bst": {
        "long_description": r"""
### 🌳 Trees & Binary Search Trees (BST)
Trees represent hierarchical data. A **Binary Search Tree** is a special type where the left child is smaller and the right child is larger than the parent.

#### Key Concepts:
- **Recursion**: Most tree problems are solved recursively.
- **Traversals**: Inorder (Left-Root-Right), Preorder, and Postorder.
- **Complexity**: Search, Insert, and Delete take $O(h)$ where $h$ is height. In a balanced tree, $h = \log n$.

```cpp
struct Node {
    int data;
    Node *left, *right;
    Node(int val) : data(val), left(nullptr), right(nullptr) {}
};
```
        """,
        "has_code_runner": True
    },
    "graphs": {
        "long_description": """
### 🕸️ Graphs
Graphs consist of vertices (nodes) and edges. They can be directed or undirected, weighted or unweighted.

#### Algorithms:
- **BFS**: Shortest path in unweighted graphs.
- **DFS**: Topological sort, cycle detection.
- **Dijkstra**: Shortest path in weighted graphs.
        """,
        "has_code_runner": True
    },
    "dynamic-programming": {
        "long_description": """
### ⚡ Dynamic Programming (DP)
DP is an optimization over plain recursion. It involves breaking down a problem into overlapping subproblems and storing the results.

#### Approaches:
1. **Top-Down**: Memoization (Recursion + Cache).
2. **Bottom-Up**: Tabulation (Iterative).
        """,
        "has_code_runner": True
    }
}

