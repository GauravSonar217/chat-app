import React, { use, useEffect, useRef, useState } from "react";
import { decryptAndGetLocal, requestHandler } from "../helper";
import dayjs from "dayjs";
import { useDebounce } from "use-debounce";
import EmojiPicker from "emoji-picker-react";
import {
  accessChat,
  getAllChats,
  getAllUsers,
  getChatMessages,
  markAsRead,
  userLogout,
} from "../controller";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import CustomFormInput from "../component/CustomFormInput";
import { getProfileImage } from "../helper/common";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userData = decryptAndGetLocal("userData");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { socket, reconnect, disconnect } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);
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
  const onlineUsersSet = new Set(onlineUsers);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 770);
  const isOnline = onlineUsersSet.has(selectedChat?.user?._id);
  const selectedChatRef = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

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

  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [selectedChat]);

  // new messages pe (smooth scroll)
  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

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
        setMessages(res.data.messages.reverse());
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
    if (!socket) return;

    socket.emit("get_online_users");

    socket.on("online_users_list", (users) => {
      setOnlineUsers(users);
    });

    socket.on("user_online", ({ userId }) => {
      setOnlineUsers((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
    });

    socket.on("user_offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off("online_users_list");
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, [socket]);

  useEffect(() => {
    if (socket && selectedChat?._id) {
      socket.emit("join_chat", selectedChat._id);
    }
  }, [socket, selectedChat]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", async (message) => {
      const isCurrentChat = selectedChatRef.current?._id === message.chatId;

      if (isCurrentChat) {
        setMessages((prev) => [...prev, message]);

        setChatList((prev) =>
          prev.map((chat) =>
            chat._id === message.chatId ? { ...chat, unreadCount: 0 } : chat,
          ),
        );

        await markAsRead(message.chatId);
      }
    });

    return () => socket.off("receive_message");
  }, [socket, selectedChat]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage;

    socket.emit("send_message", {
      chatId: selectedChat._id,
      content: newMessage,
    });

    setChatList((prev) => {
      const updated = prev.map((chat) => {
        if (chat._id === selectedChat._id) {
          return {
            ...chat,
            lastMessage: {
              text: messageText,
              createdAt: new Date(),
            },
            updatedAt: new Date(),
            unreadCount: 0,
          };
        }
        return chat;
      });

      updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return updated;
    });

    setNewMessage("");
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("chat_updated", (data) => {
      setChatList((prev) => {
        const updated = prev.map((chat) => {
          if (chat._id === data.chatId) {
            const isCurrentChat = selectedChatRef.current?._id === data.chatId;
            const isMyMessage = data.senderId === userData.userId;

            return {
              ...chat,
              lastMessage: {
                text: data.lastMessage.text,
                createdAt: data.lastMessage.createdAt,
              },
              updatedAt: data.lastMessage.createdAt,
              unreadCount: isCurrentChat
                ? 0
                : isMyMessage
                  ? chat.unreadCount
                  : (chat.unreadCount || 0) + 1,
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

  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach((msg) => {
      const date = dayjs(msg.createdAt);

      let label = "";

      if (date.isSame(dayjs(), "day")) {
        label = "Today";
      } else if (date.isSame(dayjs().subtract(1, "day"), "day")) {
        label = "Yesterday";
      } else {
        label = date.format("DD MMM YYYY");
      }

      if (!groups[label]) {
        groups[label] = [];
      }

      groups[label].push(msg);
    });

    return groups;
  };

  const groupByMinute = (messages) => {
    const result = [];

    let temp = [];

    messages.forEach((msg, index) => {
      if (temp.length === 0) {
        temp.push(msg);
      } else {
        const last = temp[temp.length - 1];

        const sameMinute = dayjs(last.createdAt).isSame(
          dayjs(msg.createdAt),
          "minute",
        );

        const sameSender = last.sender._id === msg.sender._id;

        if (sameMinute && sameSender) {
          temp.push(msg);
        } else {
          result.push([...temp]);
          temp = [msg];
        }
      }

      if (index === messages.length - 1) {
        result.push([...temp]);
      }
    });

    return result;
  };

  const groupedMessages = groupMessagesByDate(messages);

  useEffect(() => {
    const handleClickOutside = () => setShowEmoji(false);

    if (showEmoji) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showEmoji]);
  return (
    <section className="pageContainer">
      {isMobile ? (
        <>
          {!selectedChat && (
            <div className="sidebarChatList mobileFull h-full p-4 flex flex-col">
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
                        <Link
                          to="/my-profile"
                          className="hover:bg-gray-600 p-2.5 cursor-pointer rounded-xl"
                        >
                          My Profile
                        </Link>
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
              <div className="searchBarCont  border-gray-600 bg-[#202020] rounded-xl px-4 mt-3 flex items-center gap-1">
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
                        className="chatBox p-2 px-4 flex items-start gap-3 hover:bg-[#2F1E3C] rounded-xl cursor-pointer"
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="profileBox w-15 h-15 rounded-full overflow-hidden">
                          <img
                            src={getProfileImage(chat.user?.avatar)}
                            alt="user"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="userInfo h-full flex flex-col justify-center gap-1 max-w-80">
                          <h3 className="text-lg font-semibold text-white">
                            {chat.user?.fullName || ""}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {chat.lastMessage?.text || ""}
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
                  <p className="text-gray-400 text-center mt-4">
                    No results found
                  </p>
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
                                src={getProfileImage(chat.user?.avatar)}
                                alt="user"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="userInfo h-full flex flex-col justify-center gap-1 max-w-80">
                              <h3 className="text-lg font-semibold text-white">
                                {chat.user?.fullName || ""}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {chat.lastMessage?.text || ""}
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

                    {/* Contacts */}
                    {filteredUsers.length > 0 && (
                      <>
                        <h2 className="font-semibold text-gray-200">
                          Contacts
                        </h2>
                        {filteredUsers.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => handleOpenChat(user._id)}
                            className="chatBox p-2 flex items-start gap-3 hover:bg-[#2F1E3C] rounded-xl cursor-pointer"
                          >
                            <div className="profileBox w-15 h-15 rounded-full overflow-hidden">
                              <img
                                src={getProfileImage(user.avatar)}
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
          )}

          {selectedChat && (
            <div className="chatArea mobileFull border w-full h-full">
              {selectedChat && (
                <div className="chatCont border-s border-gray-600 w-full h-full flex flex-col">
                  <div className="chatHeader w-full flex items-center justify-between border-b border-gray-600 p-3 px-6">
                    <div className="flex items-center gap-3">
                      {isMobile && (
                        <button onClick={() => setSelectedChat(null)}>
                          <img
                            src="/images/png/back.png"
                            className="w-5 cursor-pointer"
                            alt=""
                          />
                        </button>
                      )}
                      <div className="profileBox relative w-15 h-15 rounded-full">
                        <img
                          src={getProfileImage(selectedChat?.user?.avatar)}
                          alt="user"
                          className="w-full h-full rounded-full object-cover"
                        />
                        {isOnline && (
                          <div className="status bg-green-400 w-3.5 h-3.5 rounded-full absolute bottom-0 right-1 z-1"></div>
                        )}
                      </div>
                      <div className="userInfo h-full flex flex-col justify-center gap-1">
                        <h3 className="text-lg font-semibold text-white">
                          {selectedChat?.user?.fullName || "Divya Sonar"}
                          {isOnline && (
                            <p className="text-sm text-[#9D4EDB]">Online</p>
                          )}
                        </h3>
                      </div>
                    </div>
                    <div className="actionBox">
                      <img src="/images/png/option.png" alt="" />
                    </div>
                  </div>
                  <div
                    ref={chatContainerRef}
                    className="chatBox w-full h-full flex flex-col gap-2 p-3 px-6 md:px-10 flex-1 overflow-auto hide-scrollbar"
                  >
                    {Object.entries(groupedMessages).map(
                      ([dateLabel, msgs]) => {
                        const minuteGroups = groupByMinute(msgs);
                        return (
                          <div key={dateLabel}>
                            {/* DATE LABEL */}
                            <div className="flex justify-center my-3">
                              <span className="bg-[#2F1E3C] text-gray-300 text-xs px-3 py-1 rounded-full">
                                {dateLabel}
                              </span>
                            </div>

                            {/* MESSAGE GROUPS */}
                            {minuteGroups.map((group, i) => {
                              const lastMsg = group[group.length - 1];

                              return (
                                <div key={i} className="flex flex-col gap-1">
                                  {group.map((msg, idx) => {
                                    const isMe =
                                      msg.sender._id === userData?.userId;
                                    const isLast = idx === group.length - 1;
                                    return (
                                      <>
                                        <div
                                          key={msg._id}
                                          className={`flex flex-col mb-2 ${
                                            isMe ? "items-end" : "items-start"
                                          }`}
                                        >
                                          <div
                                            className={`messageBox ${
                                              isMe
                                                ? "myMessage"
                                                : "otherMessage"
                                            }`}
                                          >
                                            <p className="messageContent">
                                              {msg.text}
                                            </p>
                                          </div>
                                          {isLast && (
                                            <div
                                              className={`timebox text-xs mt-1 ${
                                                isMe
                                                  ? "self-end text-right"
                                                  : "self-start text-left"
                                              }`}
                                            >
                                              {dayjs(lastMsg.createdAt).format(
                                                "hh:mm A",
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      },
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="inputBox w-full flex items-center justify-between gap-2 md:gap-3 py-3 px-3 md:px-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmoji((prev) => !prev);
                      }}
                      className="text-2xl cursor-pointer"
                    >
                      😊
                    </button>
                    {showEmoji && (
                      <div
                        className="absolute bottom-20 left-5 z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EmojiPicker
                          theme="dark"
                          onEmojiClick={handleEmojiClick}
                        />
                      </div>
                    )}
                    <CustomFormInput
                      type="text"
                      placeholder="Type a message"
                      className="w-full rounded-lg border"
                      parentClass="flex-1"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="cursor-pointer bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-10 h-10 md:w-15 md:h-15 rounded-full flex items-center justify-center"
                    >
                      <img
                        src="/images/png/send.png"
                        alt=""
                        className="w-4 h-4 md:w-7 md:h-7"
                      />
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
          )}
        </>
      ) : (
        <>
          <div className="sidebarChatList h-full p-4 flex flex-col">
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
                      <Link
                        to="/my-profile"
                        className="hover:bg-gray-600 p-2.5 cursor-pointer rounded-xl"
                      >
                        My Profile
                      </Link>
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
                          src={getProfileImage(chat.user?.avatar)}
                          alt="user"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="userInfo h-full flex flex-col justify-center gap-1 max-w-80">
                        <h3 className="text-lg font-semibold text-white">
                          {chat.user?.fullName || ""}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {chat.lastMessage?.text || ""}
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
                <p className="text-gray-400 text-center mt-4">
                  No results found
                </p>
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
                              src={getProfileImage(chat.user?.avatar)}
                              alt="user"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="userInfo h-full flex flex-col justify-center gap-1 max-w-80">
                            <h3 className="text-lg font-semibold text-white">
                              {chat.user?.fullName || ""}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {chat.lastMessage?.text || ""}
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
                              src={getProfileImage(user.avatar)}
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
                        src={getProfileImage(selectedChat?.user?.avatar)}
                        alt="user"
                        className="w-full h-full rounded-full object-cover"
                      />
                      {isOnline && (
                        <div className="status bg-green-400 w-3.5 h-3.5 rounded-full absolute bottom-0 right-1 z-1"></div>
                      )}
                    </div>
                    <div className="userInfo h-full flex flex-col justify-center gap-1">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedChat?.user?.fullName || "Divya Sonar"}
                        {isOnline && (
                          <p className="text-sm text-[#9D4EDB]">Online</p>
                        )}
                      </h3>
                    </div>
                  </div>
                  <div className="actionBox">
                    <img src="/images/png/option.png" alt="" />
                  </div>
                </div>
                <div
                  ref={chatContainerRef}
                  className="chatBox w-full h-full flex flex-col gap-2 p-3 px-6 flex-1 overflow-auto hide-scrollbar"
                >
                  {Object.entries(groupedMessages).map(([dateLabel, msgs]) => {
                    const minuteGroups = groupByMinute(msgs);
                    return (
                      <div key={dateLabel}>
                        {/* DATE LABEL */}
                        <div className="flex justify-center my-3">
                          <span className="bg-[#2F1E3C] text-gray-300 text-xs px-3 py-1 rounded-full">
                            {dateLabel}
                          </span>
                        </div>

                        {/* MESSAGE GROUPS */}
                        {minuteGroups.map((group, i) => {
                          const lastMsg = group[group.length - 1];

                          return (
                            <div key={i} className="flex flex-col gap-1">
                              {group.map((msg, idx) => {
                                const isMe =
                                  msg.sender._id === userData?.userId;
                                const isLast = idx === group.length - 1;
                                return (
                                  <>
                                    <div
                                      key={msg._id}
                                      className={`flex flex-col mb-2 ${
                                        isMe ? "items-end" : "items-start"
                                      }`}
                                    >
                                      <div
                                        className={`messageBox ${
                                          isMe ? "myMessage" : "otherMessage"
                                        }`}
                                      >
                                        <p className="messageContent">
                                          {msg.text}
                                        </p>
                                      </div>
                                      {isLast && (
                                        <div
                                          className={`timebox text-xs mt-1 ${
                                            isMe
                                              ? "self-end text-right"
                                              : "self-start text-left"
                                          }`}
                                        >
                                          {dayjs(lastMsg.createdAt).format(
                                            "hh:mm A",
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="inputBox border w-full flex items-center justify-between gap-3 py-3 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmoji((prev) => !prev);
                    }}
                    className="text-2xl cursor-pointer"
                  >
                    😊
                  </button>
                  {showEmoji && (
                    <div
                      className="absolute bottom-16 left-50 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EmojiPicker
                        theme="dark"
                        onEmojiClick={handleEmojiClick}
                      />
                    </div>
                  )}
                  <CustomFormInput
                    type="text"
                    placeholder="Type a message"
                    className="rounded-lg"
                    parentClass="flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="cursor-pointer bg-gradient-to-b from-[#2E105B] to-[#9D4EDB] w-12 h-12 rounded-full flex items-center justify-center"
                  >
                    <img
                      src="/images/png/send.png"
                      alt=""
                      width={20}
                      height={20}
                    />
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
        </>
      )}
    </section>
  );
};

export default Dashboard;
