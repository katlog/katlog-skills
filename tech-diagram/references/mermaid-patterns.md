# Mermaid Patterns

## Flowchart (流程图)

### Basic Syntax
```mermaid
flowchart TD
    A[Start] --> B{Condition?}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E
```

### Node Shapes
```
[text]      Rectangle
(text)      Rounded rectangle
([text])    Stadium/pill
[[text]]    Subroutine
[(text)]    Cylinder (database)
((text))    Circle
{text}      Diamond
{{text}}    Hexagon
[/text/]    Parallelogram
[\text\]    Parallelogram alt
[/text\]    Trapezoid
[\text/]    Trapezoid alt
```

### Arrow Types
```
-->     Arrow
---     Line
-.->    Dotted arrow
==>     Thick arrow
--text--> Arrow with text
```

### Subgraphs
```mermaid
flowchart TB
    subgraph Service Layer
        A[API Gateway]
        B[Auth Service]
    end
    subgraph Data Layer
        C[(Database)]
        D[(Cache)]
    end
    A --> B
    B --> C
    B --> D
```

---

## ER Diagram (ER图)

### Basic Syntax
```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "ordered in"
```

### Relationship Types
```
||--||   One to one
||--o{   One to zero or more
||--|{   One to one or more
o|--o{   Zero or one to zero or more
```

### With Attributes
```mermaid
erDiagram
    USER {
        int id PK
        string username UK
        string email
        datetime created_at
    }
    POST {
        int id PK
        int user_id FK
        string title
        text content
        datetime published_at
    }
    USER ||--o{ POST : creates
```

### Attribute Types
- `PK` - Primary Key
- `FK` - Foreign Key
- `UK` - Unique Key

---

## Sequence Diagram (时序图)

### Basic Syntax
```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant D as Database

    C->>S: HTTP Request
    activate S
    S->>D: Query
    D-->>S: Result
    S-->>C: Response
    deactivate S
```

### Message Types
```
->      Solid line without arrow
-->     Dotted line without arrow
->>     Solid line with arrow
-->>    Dotted line with arrow
-x      Solid line with x (async)
--x     Dotted line with x
-)      Solid line with open arrow (async)
--)     Dotted line with open arrow
```

### Loops and Conditions
```mermaid
sequenceDiagram
    loop Every minute
        Client->>Server: Heartbeat
    end

    alt Success
        Server-->>Client: 200 OK
    else Error
        Server-->>Client: 500 Error
    end

    opt Optional
        Client->>Server: Extra request
    end
```

---

## State Diagram (状态图)

### Basic Syntax
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Success : complete
    Processing --> Failed : error
    Success --> [*]
    Failed --> Idle : retry
```

### Composite States
```mermaid
stateDiagram-v2
    [*] --> Active
    state Active {
        [*] --> Running
        Running --> Paused : pause
        Paused --> Running : resume
    }
    Active --> Stopped : stop
```

---

## Class Diagram (类图)

### Basic Syntax
```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +String breed
        +bark() void
    }
    Animal <|-- Dog
```

### Relationships
```
<|--    Inheritance
*--     Composition
o--     Aggregation
-->     Association
--      Link (solid)
..>     Dependency
..|>    Realization
..      Link (dashed)
```

### Multiplicity
```mermaid
classDiagram
    Customer "1" --> "*" Order : places
    Order "*" --> "1..*" LineItem : contains
```

---

## Styling

### Theme Options
```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart TD
    A --> B
```

Available themes: `default`, `dark`, `forest`, `neutral`

### Custom Styles
```mermaid
flowchart TD
    A:::highlight --> B
    classDef highlight fill:#f96,stroke:#333
```

### Notes
- Use `%%` for comments
- Direction: `TD` (top-down), `LR` (left-right), `BT`, `RL`
