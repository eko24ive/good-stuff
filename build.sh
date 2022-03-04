printf "\nGoing into backend directory\n"
cd backend

printf "\nInstalling backend dependencies\n"
npm i

printf "\nGoing into frontent directory\n"
cd ..
cd frontend

printf "\nInstalling frontend dependencies\n"
npm i

printf "\nBuilding frontend\n"
npm run build

printf "\nOutputting frontend\n"
ls -la

printf "\nGoing into build\n"
cd build

printf "\nOutputting build\n"
ls -la