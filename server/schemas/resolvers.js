const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password');
                return userData;
            }
            throw new AuthenticationError('User is not logged in');
        },
    },
    Mutation: {
        // Add a user
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        // Login authentication
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Incorrect login');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect login');
            }

            const token = signToken(user);
            return { token, user };
        },
        // Save a book to logged-in user's collection
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const savedBook = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: bookData } },
                    { new: true, runValidators: true },
                );
                return savedBook;
            }
            throw new AuthenticationError('Must be logged in to save a book');
        },
        // Remove a book from logged-in user's collection
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const removeBook = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } }
                );
                return removeBook;
            }
            throw new AuthenticationError('Must be logged in to remove a book');
        }
    }
}

module.exports = resolvers;