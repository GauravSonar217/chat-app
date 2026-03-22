import React, { use, useEffect, useState } from "react";
import { decryptAndGetLocal, requestHandler } from "../helper";
import dayjs from "dayjs";
import { useDebounce } from "use-debounce";
import {
  accessChat,
  getAllChats,
  getAllUsers,
  getChatMessages,
  markAsRead,
  userLogout,
} from "../controller";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import CustomFormInput from "../component/CustomFormInput";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const userData = decryptAndGetLocal("userData");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { socket, reconnect, disconnect } = useSocket();
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedText] = useDebounce(searchText, 500);
  const [newMessage, setNewMessage] = useState("");
  const [chatList, setChatList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [messages, setMessages] = useState([]);

  const [chatPage, setChatPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  const [totalChatPages, setTotalChatPages] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(1);

  const [totalChats, setTotalChats] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const handleLogout = async () => {
    await requestHandler(
      async () => await userLogout(),
      setLoading,
      (res) => {
        toast.success(res.message);
        localStorage.clear();
        disconnect();
        navigate("/");
      },
      (err) => {},
    );
  };

  useEffect(() => {
    setChatPage(1);
    setUserPage(1);
    setChatList([]);
    setUsersList([]);
  }, [debouncedText]);

  const GetAllUsers = async () => {
    await requestHandler(
      async () =>
        await getAllUsers({
          page: userPage,
          perPage: 10,
          search: debouncedText,
        }),
      setLoading,
      (res) => {
        if (userPage === 1) {
          setUsersList(res.data.users);
        } else {
          setUsersList((prev) => [...prev, ...res.data.users]);
        }

        setHasMoreUsers(userPage < res.data.pagination.totalPages);
      },
      (err) => {},
    );
  };

  const GetChatList = async () => {
    await requestHandler(
      async () =>
        await getAllChats({
          page: chatPage,
          perPage: 10,
          search: debouncedText,
        }),
      setLoading,
      (res) => {
        if (chatPage === 1) {
          setChatList(res.data.chats);
        } else {
          setChatList((prev) => [...prev, ...res.data.chats]);
        }

        setHasMoreChats(chatPage < res.data.pagination.totalPages);
      },
      (err) => {},
    );
  };

  const handleOpenChat = async (userId) => {
    await requestHandler(
      async () => await accessChat({ userId }),
      setLoading,
      async (res) => {
        const chat = res.data;

        const otherUser = chat.members.find((m) => m._id !== userData._id);

        setSelectedChat({
          ...chat,
          user: otherUser,
        });
        await getMessages(chat._id);
      },
      (err) => {},
    );
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);

    setChatList((prev) =>
      prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c)),
    );

    await markAsRead(chat._id);
    await getMessages(chat._id);
  };

  const getMessages = async (chatId) => {
    await requestHandler(
      async () =>
        await getChatMessages(chatId, {
          page: 1,
          perPage: 20,
        }),
      setLoading,
      (res) => {
        setMessages(res.data.messages);
      },
      (err) => {},
    );
  };

  useEffect(() => {
    GetChatList();
  }, [chatPage, debouncedText]);

  useEffect(() => {
    if (debouncedText) {
      GetAllUsers();
    }
  }, [userPage, debouncedText]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 20) {
      if (!debouncedText) {
        if (hasMoreChats) {
          setChatPage((prev) => prev + 1);
        }
      } else {
        if (hasMoreChats) {
          setChatPage((prev) => prev + 1);
        }
        if (hasMoreUsers) {
          setUserPage((prev) => prev + 1);
        }
      }
    }
  };

  const filteredUsers = usersList.filter((user) => {
    return !chatList.some((chat) => chat.user?._id === user._id);
  });

  // Socket events

  useEffect(() => {
    if (socket && selectedChat?._id) {
      socket.emit("join_chat", selectedChat._id);
    }
  }, [socket, selectedChat]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (message) => {
      if (message.chatId === selectedChat?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => socket.off("receive_message");
  }, [socket]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    socket.emit("send_message", {
      chatId: selectedChat._id,
      content: newMessage,
    });

    setNewMessage("");
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("chat_updated", (data) => {
      setChatList((prev) => {
        const updated = prev.map((chat) => {
          if (chat._id === data.chatId) {
            const isCurrentChat = selectedChat?._id === data.chatId;

            return {
              ...chat,
              lastMessage: {
                content: data.lastMessage.text,
                createdAt: data.lastMessage.createdAt,
              },
              updatedAt: data.lastMessage.createdAt,
              unreadCount: isCurrentChat ? 0 : (chat.unreadCount || 0) + 1,
            };
          }
          return chat;
        });

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        return updated;
      });
    });

    return () => socket.off("chat_updated");
  }, [socket]);

  return (
    <section className="pageContainer">
      <div className="sidebarChatList w-[600px] h-full p-4 flex flex-col">
        <div className="sidebarHeader w-full flex items-center justify-between">
          <div className="logoCont">
            <img src="/images/png/logo.png" alt="" />
          </div>
          <div
            className="flex items-center px-1 justify-between gap-10 relative cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <img src="/images/png/option.png" alt="" />
            {showDropdown && (
              <div className="bg-[#2F1E3C] text-white absolute w-40 right-0 top-6 rounded-xl">
                <ul className="flex flex-col">
                  <li className="hover:bg-gray-600 p-2.5 cursor-pointer rounded-xl">
                    My Profile
                  </li>
                  <li className="hover:bg-gray-600 p-2.5 cursor-pointer rounded-xl">
                    Settings
                  </li>
                  <li
                    className="hover:bg-gray-600 p-2.5 cursor-pointer rounded-xl"
                    onClick={handleLogout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="searchBarCont border border-gray-600 bg-[#202020] rounded-xl px-4 mt-3 flex items-center gap-1">
          <img src="/images/png/search.png" alt="" className="w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            className="w-full outline-0 p-3"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div
          onScroll={handleScroll}
          className="chatListCont mt-3 flex flex-col gap-2 flex-1 overflow-auto hide-scrollbar"
        >
          {!debouncedText && (
            <>
              {chatList.map((chat) => (
                <div
                  key={chat._id}
                  className="chatBox p-2 flex items-start gap-3 hover:bg-[#2F1E3C] rounded-xl cursor-pointer"
                  onClick={() => handleSelectChat(chat)}
                >
                  <div className="profileBox w-15 h-15 rounded-full overflow-hidden">
                    <img
                      src="/images/png/user.png"
                      alt="user"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="userInfo h-full flex flex-col justify-center gap-1 max-w-80">
                    <h3 className="text-lg font-semibold text-white">
                      {chat.user?.fullName || ""}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {chat.lastMessage?.content || ""}
                    </p>
                  </div>
                  <div className="timeCont ml-auto h-full flex flex-col justify-start items-center gap-2">
                    <h5 className="text-sm text-gray-400">
                      {dayjs(chat.updatedAt).isSame(dayjs(), "day")
                        ? dayjs(chat.updatedAt).format("hh:mm A")
                        : dayjs(chat.updatedAt).format("DD/MM/YYYY")}
                    </h5>
                    {chat.unreadCount > 0 && (
                      <span className="count bg-[#9D4EDB] text-md font-semibold w-7 h-7 rounded-full flex justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {chatList.length === 0 && filteredUsers.length === 0 && (
            <p className="text-gray-400 text-center mt-4">No results found</p>
          )}

          {debouncedText && (
            <>
              {/* Chats */}
              {chatList.length > 0 && (
                <>
                  <h2 className="font-semibold text-gray-200">Chats</h2>
                  {chatList.map((chat) => (
                    <div
                      key={chat._id}
                      onClick={() => handleSelectChat(chat)}
                      className="chatBox p-2 flex items-start gap-3 hover:bg-[#2F1E3C] rounded-xl cursor-pointer"
                    >
                      <div className="profileBox w-15 h-15 rounded-full overflow-hidden">
                        <img
                          src="/images/png/user.png"
                          alt="user"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="userInfo h-full flex flex-col justify-center gap-1 max-w-80">
                        <h3 className="text-lg font-semibold text-white">
                          {chat.user?.fullName || ""}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {chat.lastMessage?.content || ""}
                        </p>
                      </div>
                      <div className="timeCont ml-auto h-full flex flex-col justify-start items-center gap-2">
                        <h5 className="text-sm text-gray-400">
                          {dayjs(chat.updatedAt).isSame(dayjs(), "day")
                            ? dayjs(chat.updatedAt).format("hh:mm A")
                            : dayjs(chat.updatedAt).format("DD/MM/YYYY")}
                        </h5>
                        <span className="count bg-[#9D4EDB] text-md font-semibold w-7 h-7 rounded-full flex justify-center">
                          2
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Contacts */}
              {filteredUsers.length > 0 && (
                <>
                  <h2 className="font-semibold text-gray-200">Contacts</h2>
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleOpenChat(user._id)}
                      className="chatBox p-2 flex items-start gap-3 hover:bg-[#2F1E3C] rounded-xl cursor-pointer"
                    >
                      <div className="profileBox w-15 h-15 rounded-full overflow-hidden">
                        <img
                          src="/images/png/user.png"
                          alt="user"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="userInfo h-full flex flex-col justify-center gap-1 max-w-80">
                        <h3 className="text-lg font-semibold text-white">
                          {user.fullName || ""}
                        </h3>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div className="chatArea w-full h-full">
        {selectedChat && (
          <div className="chatCont border-s border-gray-600 w-full h-full flex flex-col">
            <div className="chatHeader w-full flex items-center justify-between border-b border-gray-600 p-3 px-6">
              <div className="flex items-center gap-3">
                <div className="profileBox relative w-15 h-15 rounded-full">
                  <img
                    src="/images/png/user.png"
                    alt="user"
                    className="w-full h-full object-cover"
                  />
                  <div className="status bg-green-400 w-3.5 h-3.5 rounded-full absolute bottom-0 right-1 z-1"></div>
                </div>
                <div className="userInfo h-full flex flex-col justify-center gap-1">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedChat?.user?.fullName || "Divya Sonar"}
                    <p className="text-sm text-[#9D4EDB]">Online</p>
                  </h3>
                </div>
              </div>
              <div className="actionBox">
                <img src="/images/png/option.png" alt="" />
              </div>
            </div>
            <div className="chatBox w-full h-full flex flex-col gap-2 p-3 px-6 flex-1 overflow-auto hide-scrollbar">
              <div className={`messageBox otherMessage`}>
                <p>
                  Hello world, How are you? Lorem ipsum dolor sit, amet
                  consectetur adipisicing elit. Doloremque totam repellendus
                  sed, eveniet reprehenderit adipisci veritatis molestiae facere
                  tenetur at ex quidem officia aut dolores hic facilis placeat
                  reiciendis accusantium saepe necessitatibus et aliquam
                  distinctio. Delectus ea officia unde aperiam minus ex amet
                  corrupti animi nemo, provident, incidunt fugiat velit.
                </p>
                <div className="timebox flex items-center justify-end text-gray-400">
                  02:33 pm
                </div>
              </div>
              <div className={`messageBox myMessage`}>
                <p>
                  Hello world, How are you? Lorem ipsum dolor sit, amet
                  consectetur adipisicing elit. Doloremque totam repellendus
                  sed, eveniet reprehenderit adipisci veritatis molestiae facere
                  tenetur at ex quidem officia aut dolores hic facilis placeat
                  reiciendis accusantium saepe necessitatibus et aliquam
                  distinctio. Delectus ea officia unde aperiam minus ex amet
                  corrupti animi nemo, provident, incidunt fugiat velit.
                </p>
                <div className="timebox flex items-center justify-end text-black">
                  02:33 pm
                </div>
              </div>
            </div>
            <div className="inputBox w-full flex items-center justify-between gap-3 py-3 px-6">
              <CustomFormInput
                type="text"
                placeholder="Type a message"
                className="w-ful rounded-lg"
                parentClass="w-full"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                onClick={handleSendMessage}
                className="cursor-pointer bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-12 h-12 rounded-full flex items-center justify-center"
              >
                <img src="/images/png/send.png" alt="" width={20} height={20} />
              </button>
            </div>
          </div>
        )}
        {!selectedChat && (
          <div className="imgCont border-s border-gray-600 w-full h-full flex items-center justify-center">
            <img
              src="/images/png/chatbot.png"
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
