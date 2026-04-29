package com.careerpath.backend;

import com.google.cloud.firestore.Firestore;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BackendApplicationTests {

	@MockBean
	private Firestore firestore;

	@Test
	void contextLoads() {
	}

}
