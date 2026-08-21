export interface Operator {
  id: string;
  employeeId: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  department: string;
  joiningDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Current shift obtained through Shift Assignment (not stored here per requirements)

const firstNames = ["Priya", "Sunita", "Meena", "Kavita", "Anita", "Rekha", "Sushma", "Geeta", "Lata", "Pushpa", "Ramesh", "Suresh", "Mahesh", "Rajesh", "Dinesh", "Naresh", "Umesh", "Ganesh", "Santosh", "Yogesh", "Pooja", "Neha", "Asha", "Usha", "Manju", "Saroj", "Kamlesh", "Vijay", "Ajay", "Sanjay", "Arun", "Tarun", "Varun", "Kiran", "Nisha", "Ritu", "Seema", "Reena", "Veena", "Leena", "Mohan", "Rohan", "Sohan", "Laxman", "Raman", "Bharat", "Madan", "Chandan", "Nandan", "Pawan"];
const lastNames = ["Sharma", "Verma", "Gupta", "Kumar", "Singh", "Yadav", "Patel", "Joshi", "Tiwari", "Mishra", "Chauhan", "Pandey", "Dubey", "Chaudhary", "Soni", "Rao", "Reddy", "Nair", "Pillai", "Menon", "Das", "Devi", "Kumari", "Bai", "Begum", "Khan", "Ansari", "Sheikh", "Siddiqui", "Malik", "Thakur", "Rathore", "Rajput", "Bhatt", "Mehta", "Shah", "Kapoor", "Malhotra", "Bhatia", "Khanna", "Ahuja", "Arora", "Sethi", "Chopra", "Walia", "Bansal", "Mittal", "Agarwal", "Goyal", "Jain"];

const departments = ["Sewing", "Finishing", "Packing", "Quality Control"];

function generateOperators(): Operator[] {
  const ops: Operator[] = [];
  for (let i = 0; i < 50; i++) {
    const fname = firstNames[i];
    const lname = lastNames[i];
    const gender: "Male" | "Female" = i < 30 ? "Female" : "Male";
    const joiningYear = 2018 + Math.floor(Math.random() * 7);
    const joiningMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const joiningDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");

    ops.push({
      id: String(i + 1),
      employeeId: `EMP-${String(1000 + i + 1).padStart(4, "0")}`,
      name: `${fname} ${lname}`,
      age: 22 + Math.floor(Math.random() * 20),
      gender,
      department: departments[i % departments.length],
      joiningDate: `${joiningYear}-${joiningMonth}-${joiningDay}`,
      active: i < 47, // 3 inactive
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    });
  }
  return ops;
}

let mockOperators: Operator[] = generateOperators();

export const operatorsApi = {
  getOperators: async (search?: string): Promise<Operator[]> => {
    return new Promise((resolve) =>
      setTimeout(() => {
        let results = [...mockOperators];
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(
            (o) =>
              o.name.toLowerCase().includes(s) ||
              o.employeeId.toLowerCase().includes(s) ||
              o.department.toLowerCase().includes(s)
          );
        }
        resolve(results);
      }, 400)
    );
  },

  createOperator: async (op: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOp: Operator = {
          ...op,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockOperators = [...mockOperators, newOp];
        resolve(newOp);
      }, 500);
    });
  },

  updateOperator: async (id: string, op: Omit<Operator, "id" | "createdAt" | "updatedAt">): Promise<Operator> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockOperators = mockOperators.map((o) =>
          o.id === id ? { ...o, ...op, updatedAt: new Date().toISOString() } : o
        );
        resolve({ ...op, id, createdAt: "", updatedAt: new Date().toISOString() });
      }, 500);
    });
  },

  toggleActive: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockOperators = mockOperators.map((o) =>
          o.id === id ? { ...o, active: !o.active, updatedAt: new Date().toISOString() } : o
        );
        resolve();
      }, 300);
    });
  },
};
