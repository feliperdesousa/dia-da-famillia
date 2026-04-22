CREATE TABLE forms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id),
    text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL
);

CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id),
    responder_name VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL
);