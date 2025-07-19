// App.jsx
import React, { useState, useEffect } from 'react';

// Компонент для отображения сообщений (замена alert)
function MessageDisplay({ message, type, onClose }) {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
  const borderColor = type === 'error' ? 'border-red-500' : 'border-green-500';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg border ${bgColor} ${borderColor} z-50`} role="alert">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{message}</span>
        <button onClick={onClose} className="ml-4 text-lg font-bold">
          &times;
        </button>
      </div>
    </div>
  );
}

// Компонент для отображения деталей фильма, отзывов и оценок
function MovieDetail({ movieId, onBackToList, isAuthenticated, authToken, onLoginSuccess }) {
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  const [newReviewText, setNewReviewText] = useState('');
  const [newRatingValue, setNewRatingValue] = useState('');

  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('testpassword');

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error(`Login failed! Status: ${response.status}`);
      }
      const data = await response.json();
      onLoginSuccess(data.access); // Передаем токен вверх
      showMessage('Успешный вход! Теперь вы можете оставлять отзывы и оценки.', 'info');
    } catch (err) {
      setError(`Ошибка входа: ${err.message}`);
      showMessage(`Ошибка входа: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);
      try {
        const movieResponse = await fetch(`http://127.0.0.1:8000/api/cinema/movies/${movieId}/`);
        if (!movieResponse.ok) {
          throw new Error(`HTTP error! status: ${movieResponse.status}`);
        }
        const movieData = await movieResponse.json();
        setMovie(movieData);

        const reviewsResponse = await fetch(`http://127.0.0.1:8000/api/cinema/reviews/?movie=${movieId}`);
        if (!reviewsResponse.ok) {
          throw new Error(`HTTP error! status: ${reviewsResponse.status}`);
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.results || reviewsData);

        const ratingsResponse = await fetch(`http://127.0.0.1:8000/api/cinema/ratings/?movie=${movieId}`);
        if (!ratingsResponse.ok) {
          throw new Error(`HTTP error! status: ${ratingsResponse.status}`);
        }
        const ratingsData = await ratingsResponse.json();
        setRatings(ratingsData.results || ratingsData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieData();
    }
  }, [movieId]);

  const handleSubmitReview = async () => {
    if (!newReviewText.trim()) {
      showMessage('Отзыв не может быть пустым.', 'error');
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) { headers['Authorization'] = `Bearer ${authToken}`; }

      const response = await fetch('http://127.0.0.1:8000/api/cinema/reviews/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ movie: movieId, text: newReviewText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to submit review: ${JSON.stringify(errorData)}`);
      }

      const submittedReview = await response.json();
      setReviews([...reviews, submittedReview]);
      setNewReviewText('');
      showMessage('Отзыв успешно добавлен!', 'info');
    } catch (err) {
      setError(`Ошибка при добавлении отзыва: ${err.message}`);
      showMessage(`Ошибка при добавлении отзыва: ${err.message}`, 'error');
    }
  };

  const handleSubmitRating = async () => {
    const ratingValue = parseInt(newRatingValue);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 10) {
      showMessage('Оценка должна быть числом от 1 до 10.', 'error');
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) { headers['Authorization'] = `Bearer ${authToken}`; }

      const response = await fetch('http://127.0.0.1:8000/api/cinema/ratings/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ movie: movieId, value: ratingValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to submit rating: ${JSON.stringify(errorData)}`);
      }

      const submittedRating = await response.json();
      setRatings([...ratings, submittedRating]);
      setNewRatingValue('');
      showMessage('Оценка успешно добавлена!', 'info');
    } catch (err) {
      setError(`Ошибка при добавлении оценки: ${err.message}`);
      showMessage(`Ошибка при добавлении оценки: ${err.message}`, 'error');
    }
  };

  if (loading) { return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><p className="text-xl text-indigo-700 font-semibold">Загрузка деталей фильма...</p></div>; }
  if (error) { return (<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><p className="text-xl text-red-600 font-semibold">Ошибка: {error}</p><button onClick={onBackToList} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">Назад к списку</button></div>); }
  if (!movie) { return (<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><p className="text-xl text-gray-600">Фильм не найден.</p><button onClick={onBackToList} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">Назад к списку</button></div>); }

  const averageRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length).toFixed(1) : 'Нет оценок';

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <MessageDisplay message={message} type={messageType} onClose={() => setMessage(null)} />
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <button onClick={onBackToList} className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition duration-300">
          &larr; Назад к списку фильмов
        </button>

        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4 text-center">{movie.title}</h1>
        <p className="text-gray-700 text-lg mb-2 text-center">{movie.description}</p>
        <p className="text-gray-600 text-sm mb-1 text-center">Год выпуска: {movie.release_year}</p>
        <p className="text-gray-600 text-sm mb-4 text-center">Длительность: {movie.duration_minutes} мин.</p>
        <p className="text-gray-600 text-sm mb-4 text-center">Средняя оценка: {averageRating}</p>

        {movie.genres && movie.genres.length > 0 && (
          <div className="mb-4 text-center">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Жанры:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {movie.genres.map(genre => (<span key={genre.id} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">{genre.name}</span>))}
            </div>
          </div>
        )}

        {movie.actors && movie.actors.length > 0 && (
          <div className="mb-4 text-center">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Актеры:</h3>
            <ul className="list-disc list-inside inline-block text-left">
              {movie.actors.map(actor => (<li key={actor.id} className="text-gray-700">{actor.first_name} {actor.last_name}</li>))}
            </ul>
          </div>
        )}

        {movie.directors && movie.directors.length > 0 && (
          <div className="mb-6 text-center">
            <h3 className="text-xl font-semibold text-indigo-600 mb-2">Режиссеры:</h3>
            <ul className="list-disc list-inside inline-block text-left">
              {movie.directors.map(director => (<li key={director.id} className="text-gray-700">{director.first_name} {director.last_name}</li>))}
            </ul>
          </div>
        )}

        <hr className="my-8 border-gray-300" />

        {/* Раздел аутентификации */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Аутентификация</h3>
          {!isAuthenticated ? (
            <div className="flex flex-col items-center space-y-4">
              <input type="text" placeholder="Имя пользователя (например, testuser)" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full max-w-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="password" placeholder="Пароль (например, testpassword)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full max-w-sm p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleLogin} className="w-full max-w-sm px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300">Войти</button>
              <p className="text-sm text-gray-500 mt-2">Для тестирования используйте имя пользователя `testuser` и пароль `testpassword`. Убедитесь, что такой пользователь существует в вашем Django-проекте.</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg text-green-700 font-semibold mb-4">Вы вошли как: {username}</p>
              <button onClick={onBackToList} className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300">Выйти</button>
            </div>
          )}
        </div>

        {/* Раздел отзывов */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4">Отзывы ({reviews.length})</h3>
          {reviews.length === 0 ? (<p className="text-gray-600">Пока нет отзывов. Будьте первым!</p>) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <p className="font-semibold text-gray-800">{review.user}:</p>
                  <p className="text-gray-700 text-sm italic">"{review.text}"</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(review.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-blue-200">
            <h4 className="text-xl font-semibold text-indigo-600 mb-3">Оставить отзыв:</h4>
            <textarea className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4" placeholder="Напишите ваш отзыв здесь..." value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)}></textarea>
            <button onClick={handleSubmitReview} className="mt-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300">Отправить отзыв</button>
          </div>
        </div>

        {/* Раздел оценок */}
        <div className="p-6 bg-purple-50 rounded-lg shadow-inner">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4">Оценки ({ratings.length})</h3>
          {ratings.length === 0 ? (<p className="text-gray-600">Пока нет оценок. Поставьте первую!</p>) : (
            <div className="space-y-4">
              {ratings.map(rating => (
                <div key={rating.id} className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                  <p className="font-semibold text-gray-800">{rating.user}:</p>
                  <p className="text-gray-700 text-sm">Оценка: <span className="font-bold text-indigo-700 text-lg">{rating.value}</span>/10</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(rating.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-purple-200">
            <h4 className="text-xl font-semibold text-indigo-600 mb-3">Поставить оценку (1-10):</h4>
            <input type="number" min="1" max="10" className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ваша оценка (1-10)" value={newRatingValue} onChange={(e) => setNewRatingValue(e.target.value)} />
            <button onClick={handleSubmitRating} className="mt-3 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300">Отправить оценку</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент для страницы профиля пользователя
function UserProfile({ onBackToList, isAuthenticated, authToken, onLogout }) {
  const [userProfile, setUserProfile] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || !authToken) {
        setError("Пожалуйста, войдите, чтобы просмотреть свой профиль.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Запрос данных профиля пользователя
        const userResponse = await fetch('http://127.0.0.1:8000/api/cinema/users/me/', {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user profile! Status: ${userResponse.status}`);
        }
        const userData = await userResponse.json();
        setUserProfile(userData);

        // Запрос отзывов пользователя
        const reviewsResponse = await fetch(`http://127.0.0.1:8000/api/cinema/reviews/?user=${userData.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!reviewsResponse.ok) {
          throw new Error(`Failed to fetch user reviews! Status: ${reviewsResponse.status}`);
        }
        const reviewsData = await reviewsResponse.json();
        setUserReviews(reviewsData.results || reviewsData);

        // Запрос оценок пользователя
        const ratingsResponse = await fetch(`http://127.0.0.1:8000/api/cinema/ratings/?user=${userData.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!ratingsResponse.ok) {
          throw new Error(`Failed to fetch user ratings! Status: ${ratingsResponse.status}`);
        }
        const ratingsData = await ratingsResponse.json();
        setUserRatings(ratingsData.results || ratingsData);

      } catch (err) {
        setError(err.message);
        showMessage(`Ошибка при загрузке профиля: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, authToken]);

  if (loading) { return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><p className="text-xl text-indigo-700 font-semibold">Загрузка профиля...</p></div>; }
  if (error) { return (<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><p className="text-xl text-red-600 font-semibold">Ошибка: {error}</p><button onClick={onBackToList} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">Назад к списку</button></div>); }
  if (!userProfile) { return (<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><p className="text-xl text-gray-600">Профиль не найден.</p><button onClick={onBackToList} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300">Назад к списку</button></div>); }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <MessageDisplay message={message} type={messageType} onClose={() => setMessage(null)} />
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <button onClick={onBackToList} className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition duration-300">
          &larr; Назад к списку фильмов
        </button>
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-6 text-center">Профиль пользователя: {userProfile.username}</h1>

        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4">Мои данные</h3>
          <p className="text-lg text-gray-700">Имя пользователя: <span className="font-semibold">{userProfile.username}</span></p>
          {userProfile.email && <p className="text-lg text-gray-700">Email: <span className="font-semibold">{userProfile.email}</span></p>}
          <button onClick={onLogout} className="mt-4 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300">Выйти</button>
        </div>

        <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4">Мои отзывы ({userReviews.length})</h3>
          {userReviews.length === 0 ? (<p className="text-gray-600">Вы еще не оставили ни одного отзыва.</p>) : (
            <div className="space-y-4">
              {userReviews.map(review => (
                <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <p className="font-semibold text-gray-800">Фильм: {review.movie_title}</p>
                  <p className="text-gray-700 text-sm italic">"{review.text}"</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(review.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-purple-50 rounded-lg shadow-inner">
          <h3 className="text-2xl font-bold text-indigo-700 mb-4">Мои оценки ({userRatings.length})</h3>
          {userRatings.length === 0 ? (<p className="text-gray-600">Вы еще не поставили ни одной оценки.</p>) : (
            <div className="space-y-4">
              {userRatings.map(rating => (
                <div key={rating.id} className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
                  <p className="font-semibold text-gray-800">Фильм: {rating.movie_title}</p>
                  <p className="text-gray-700 text-sm">Оценка: <span className="font-bold text-indigo-700 text-lg">{rating.value}</span>/10</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(rating.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Главный компонент приложения (App)
function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false); // Новое состояние для профиля

  const [isAuthenticated, setIsAuthenticated] = useState(false); // Состояние аутентификации
  const [authToken, setAuthToken] = useState(null); // Токен аутентификации

  const handleLoginSuccess = (token) => {
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = `http://127.0.0.1:8000/api/cinema/movies/${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMovies(data.results || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!selectedMovieId && !showUserProfile) { // Загружаем фильмы, только если не выбран фильм и не показан профиль
      fetchMovies();
    }
  }, [searchTerm, selectedMovieId, showUserProfile]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleMovieClick = (movieId) => {
    setSelectedMovieId(movieId);
    setShowUserProfile(false); // Скрываем профиль при выборе фильма
  };

  const handleBackToList = () => {
    setSelectedMovieId(null);
    setShowUserProfile(false); // Скрываем профиль при возврате к списку
    setSearchTerm('');
  };

  const handleShowUserProfile = () => {
    setShowUserProfile(true);
    setSelectedMovieId(null); // Скрываем детали фильма при показе профиля
  };


  if (selectedMovieId) {
    return <MovieDetail movieId={selectedMovieId} onBackToList={handleBackToList} isAuthenticated={isAuthenticated} authToken={authToken} onLoginSuccess={handleLoginSuccess} />;
  }

  if (showUserProfile) {
    return <UserProfile onBackToList={handleBackToList} isAuthenticated={isAuthenticated} authToken={authToken} onLogout={handleLogout} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-xl text-indigo-700 font-semibold">Загрузка фильмов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-xl text-red-600 font-semibold">Ошибка: {error}</p>
        <p className="text-md text-gray-700 mt-2">Пожалуйста, убедитесь, что ваш Django сервер запущен и доступен по адресу http://127.0.0.1:8000.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-700 text-center">
            Список фильмов
          </h1>
          <button
            onClick={handleShowUserProfile}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
          >
            Профиль
          </button>
        </div>

        {/* Поле поиска */}
        <div className="mb-6 flex items-center space-x-4">
          <input
            type="text"
            placeholder="Искать фильмы по названию..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {movies.length === 0 && !loading && !error ? (
          <p className="text-lg text-gray-600 text-center">Фильмы не найдены.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="bg-indigo-50 p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-300"
                onClick={() => handleMovieClick(movie.id)}
              >
                <h2 className="text-2xl font-bold text-indigo-800 mb-2">{movie.title}</h2>
                <p className="text-gray-700 text-sm mb-1">Год выпуска: {movie.release_year}</p>
                <p className="text-gray-700 text-sm mb-4">Длительность: {movie.duration_minutes} мин.</p>
                <p className="text-gray-600 text-sm line-clamp-3">{movie.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
