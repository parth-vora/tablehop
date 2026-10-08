export const timeSlots = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

export const restaurants = [
    {
        id: "1",
        name: "The Fancy Fork",
        neighborhood: "Downtown",
        cuisine: "French",
        priceRange: "$$$",
        rating: 4.8,
        categories: ["Fine Dining", "Romantic"],
        description: "A luxurious dining experience with exquisite French cuisine.",
        tables : [
            { id: "table1", size: 2},
            { id: "table2", size: 4},
            { id: "table3", size: 6}
        ]
    },
    {
        id: "2",
        name: "Sushi Central",
        neighborhood: "Midtown",
        cuisine: "Japanese",
        priceRange: "$$",
        rating: 4.5,
        categories: ["Casual Dining", "Sushi"],
        description: "Fresh sushi and sashimi in a modern setting.",
        tables : [
            { id: "table1", size: 4},
            { id: "table2", size: 4},
            { id: "table3", size: 6}
        ]
    },
    {
        id: "3",
        name: "Pasta Paradise",
        neighborhood: "Uptown",
        cuisine: "Italian",
        priceRange: "$$",
        rating: 4.3,
        categories: ["Casual Dining", "Italian"],
        description: "Delicious pasta dishes in a cozy atmosphere.",
        tables : [
            { id: "table1", size: 2},
            { id: "table2", size: 4},
            { id: "table3", size: 6}
        ]
    },
    {
        id: "4",
        name: "Burger Haven",
        neighborhood: "Downtown",
        cuisine: "American",
        priceRange: "$",
        rating: 4.0,
        categories: ["Fast Food", "Burgers"],
        description: "Juicy burgers and crispy fries for a quick bite.",
        tables : [
            { id: "table1", size: 2},
            { id: "table2", size: 4},
            { id: "table3", size: 6}
        ]
    },
    {
        id: "5",
        name: "Taco Town",
        neighborhood: "Midtown",
        cuisine: "Mexican",
        priceRange: "$",
        rating: 4.2,
        categories: ["Casual Dining", "Mexican"],
        description: "Tasty tacos and margaritas in a lively setting.",
        tables : [
            { id: "table1", size: 2},
            { id: "table2", size: 2},
            { id: "table3", size: 2}
        ]
    },
    {
        id: "6",
        name: "Delhi Corner",
        neighborhood: "Uptown",
        cuisine: "Indian",
        priceRange: "$$",
        rating: 4.6,
        categories: ["Casual Dining", "Indian"],
        description: "Authentic Indian curries and naan bread.",
        tables : [
            { id: "table1", size: 2},
            { id: "table2", size: 4},
            { id: "table3", size: 4},
            { id: "table4", size: 6}
        ]
    },
    {
        id: "7",
        name: "Dragon's Breath",
        neighborhood: "Downtown",
        cuisine: "Chinese",
        priceRange: "$$",
        rating: 4.4,
        categories: ["Casual Dining", "Chinese"],
        description: "Savor the flavors of traditional Chinese dishes.",
        tables : [
            { id: "table1", size: 2},
            { id: "table2", size: 2},
            { id: "table3", size: 2},
            { id: "table4", size: 4},
            { id: "table5", size: 4}
        ]
    }
];

export const bookings = [
    ["1", "table1", "2024-06-15","19:00", 2, "John Doe"],
    ["1", "table2", "2024-06-15","20:00", 4, "Jane Smith"],
    ["1", "table1", "2024-06-15", "20:00", 2, "Ellis Park"],
    ["1", "table3", "2024-06-15", "20:00", 6, "Sam Lindqvist"],
    ["2", "table1", "2024-06-15","18:30", 4, "Alice Johnson"],
    ["3", "table2", "2024-06-15","19:30", 4, "Bob Brown"],
    ["4", "table1", "2024-06-15","20:30", 2, "Charlie Davis"],
    ["5", "table1", "2024-06-15","21:00", 2, "Diana Evans"],
    ["6", "table3", "2024-06-15","19:00", 4, "Frank Green"],
    ["7", "table5", "2024-06-15","20:00", 4, "Grace Harris"]
];

export const waitlist = [
    ["1", "2024-06-15", "20:00", 2, "Maya Chen"],
    ["1", "2024-06-15", "20:00", 4, "Jordan Blake"],
    ["1", "2024-06-15", "20:00", 3, "Priya Raman"],
];

