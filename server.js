// Серверная часть страницы
const express = require("express");
const axios = require('axios');
const mongoose = require("mongoose");
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");

// Инициализация Пользователя
const User = require("./model/User.js");
const Card = require("./model/Card.js");
const Section = require("./model/Section.js");
const apiKey = "Aqh03rwaoVETsfBESVAvtg==9lEpMF9Kqmza2hkl"
var limit = 3;

const app = express();
mongoose.connect("mongodb+srv://nurzhakhan:nuke@cluster.4lx28hl.mongodb.net/");
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "default",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));
app.use(express.json());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Домашняя страница
app.get("/", (req, res) => {
    res.render("home");
});

// Страница регистрации
app.get("/register", (req, res) => {
    res.render("register");
});

// Обработка регистрации
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.send("<script>alert('Username and password cannot be empty.'); window.history.back();</script>");
        }

        if (password.length < 8) {
            return res.send("<script>alert('Password must be at least 8 characters long.'); window.history.back();</script>");
        }

        const existingUser = await User.findOne({ username: username });

        if (existingUser) {
            console.log("User already is in database");
            return res.send("<script>alert('User already is in database'); window.history.back();</script>");
        }

        const newUser = new User({ username: username, password: password });

        await User.register(newUser, password);
        req.login(newUser, (err) => {
            if (err) {
                console.error('Error during login after registration:', err);
                return res.status(500).json({ message: 'Internal Server Error', error: err.message });
            }
            return res.redirect("/logged");
        });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Страница логина
app.get("/login", (req, res) => {
    res.render("login", { errorMessage: "" });
});

app.get("/logged", isLogged, (req, res) => {
    res.render("logged");
});

app.get("/logged-admin", isLogged, (req, res) => {
    res.render("logged-admin");
});

// Обработка Логина
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login', { errorMessage: "User with this information doesn't exist." });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            if (user.role === "admin") {
                return res.redirect('/logged-admin');
            } else {
                return res.redirect('/logged');
            }
        });
    })(req, res, next);
});

app.get("/profile", isLogged, (req, res) => {
    res.render("profile", { user: req.user });
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id, 
            { username, password }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Страница для зарегестрированного пользователя
app.get("/logged", isLogged, (req, res) => {
    res.render("logged");
});

// Выход
app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/");
    });
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Получение информации касательно пользователей с базы данных
app.post('/api/users', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            console.log("User already is in database");
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({ username: username , password: password});

        User.register(newUser, password, (err, user) => {
            if (err) {
                console.error('Error registering new user:', err);
                return res.status(500).json({ message: 'Internal Server Error', error: err.message });
            }
            res.status(201).json({ message: "User registered successfully", user: user });
        });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.delete('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOneAndDelete({ username: username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get("/admin", (req, res) => {
    res.render("admin")
});

app.get("/section/create", isLogged, (req, res) => {
    res.render("create-section");
});

app.post("/section/create", isLogged, async (req, res) => {
    const { sectionName } = req.body;
    const newSection = new Section({ name: sectionName, createdBy: req.user._id });
    await newSection.save();

    // Обновляем список разделов у пользователя
    await User.findByIdAndUpdate(req.user._id, { $push: { sections: newSection._id } });

    res.redirect(`/card/create/${newSection._id}`);
});

app.get("/section/select", isLogged, async (req, res) => {
    const sections = await Section.find({ createdBy: req.user._id });
    res.render("select-section", { sections: sections });
});

app.get("/card/create/:sectionId", isLogged, async (req, res) => {
    const { sectionId } = req.params;
    const section = await Section.findById(sectionId);
    res.render("create-card", { sectionId: sectionId, sectionName: section.name });
});

app.post("/card/create/:sectionId", isLogged, async (req, res) => {
    const { sectionId } = req.params;
    const { word, definition } = req.body;
    const newCard = new Card({ word: word, definition: definition, section: sectionId });
    await newCard.save();

    // Обновляем список карточек в разделе
    await Section.findByIdAndUpdate(sectionId, { $push: { cards: newCard._id } });

    res.redirect("/section/select");
});

app.get('/show-cards/:sectionId', isLogged, async (req, res) => {
    try {
        const {sectionId} = req.params;

        console.log(sectionId)

        const cards = await Card.find({ section: { $eq: new mongoose.Types.ObjectId(sectionId) } });

        console.log(cards)
        
        if(!cards) {
            return res.status(404).send('No cards found for the given user and section.');
        }

        res.render('show-cards', { cards: cards });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).send(error.message);
    }
});

app.get('/get-cards', isLogged, async (req, res) => {
    const cards = await Card.find({});
    console.log(cards)
    res.json(cards);
});

app.put('/update-card/:cardId', async (req, res) => {
    const { cardId } = req.params;
    const { word, definition } = req.body;

    try {
        const updatedCard = await Card.findByIdAndUpdate(
            cardId, 
            { word, definition },
            { new: true }
        );

        if (!updatedCard) {
            return res.status(404).send('Card not found');
        }

        res.send(updatedCard);
    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.get('/delete-cards/:sectionId', isLogged, async (req, res) => {
    const {sectionId} = req.params;

    const cards = await Card.find({ section: { $eq: new mongoose.Types.ObjectId(sectionId) } });    
    console.log(cards)
    res.render('delete-cards', {words: cards});
})


app.delete('/delete-card/:id', async (req, res) => {
    try {
        const cardId = req.params.id;
        console.log(cardId)
        await Card.findByIdAndDelete(cardId);
        await Section.updateMany({cards: new mongoose.Types.ObjectId(cardId)}, {$pull: {cards: new mongoose.Types.ObjectId(cardId)}})
        res.send({ message: 'Card deleted successfully' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.get('/facts', isLogged, (req, res) => {
    res.render('facts');
})

app.get('/facts-random', isLogged, async (req, res) => {
    const url = 'https://api.api-ninjas.com/v1/facts?limit=1'

    const response = await axios.get(url, {
        headers: {
            'X-Api-Key': apiKey
        }
    })

    console.log(response.data[0].fact)

    res.json(response.data[0].fact)
})

app.get('/random-education-quote', isLogged, async (req, res) => {
    try {
        const response = await axios.get('https://api.api-ninjas.com/v1/quotes?category=education', {
            headers: {
                'X-Api-Key': apiKey 
            }
        });

        const quote = response.data[0]; 
        res.json({
            quote: quote.quote,
            author: quote.author
        });
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).send('Error fetching quote');
    }
});

function isLogged(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
