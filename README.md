# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


okay good. Now how do I set up the app so that I can enter the project brief, then I have a widget I can use to create tasks with names and details. Those tasks are what I will eventually later in the app be able to change the date of, for start and end. Then let me have another widget on the dashboard I can use to create authority buckets. I should be able to attach each task to an authority bucket, and create a code for that bucket. Once the code is created it should be able to be used by someone to log in to the app, and they should only have write access for the tasks they are assigned to, which should reflect in RACI. only the administrator can log in and edit tasks, other members only have write access to the tasks they are assigned to, though they can see all tasks. Write meaning they can click the RACI matrix and change the buttons. I want no hardcoded info for any members of the project. When a member comes in using the code, they can supply their name, which will reflect on the dashboard with their assigned tasks. Remove all hardcoded values.



Make no mistake in your implementation